function initGame(){

    // ============================================================
    // CONSTANTS & STATE
    // ============================================================
    var FILES = "abcdefgh";
    var container = document.getElementById("chess-canvas-container");
    var game = new Chess();

    var squareMeshMap = {};   // squareName -> THREE.Group (piece)
    var squareBaseMeshes = {}; // squareName -> THREE.Mesh (board tile)
    var selectedSquare = null;
    var legalTargets = [];
    var animating = false;
    var capturedWhite = [];  // types of captured white pieces
    var capturedBlack = [];  // types of captured black pieces
    var startTime = Date.now();

    var PIECE_GLYPH = {
      w: { p:"♙", n:"♘", b:"♗", r:"♖", q:"♕", k:"♔" },
      b: { p:"♟", n:"♞", b:"♝", r:"♜", q:"♛", k:"♚" }
    };

    // ============================================================
    // RENDERER / SCENE / CAMERA
    // ============================================================
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0907);
    scene.fog = new THREE.Fog(0x0c0907, 55, 100);

    // Dikey FOV'u ekranın en-boy oranına göre hesaplıyoruz: telefon dikey tutulduğunda
    // (dar/uzun ekran) sabit bir dikey FOV, yatayda çok dar bir görüş açısına dönüşür ve
    // tahtanın kenarları ekrandan taşar. Bunun yerine hep ~46° yatay görüş açısı hedefliyoruz.
    var CHESS_TARGET_HFOV_DEG = 46;
    function chessComputeVFov(aspect){
      var hFovRad = CHESS_TARGET_HFOV_DEG * Math.PI / 180;
      var vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect);
      return vFovRad * 180 / Math.PI;
    }
    var initialAspect = container.clientWidth / container.clientHeight;
    var camera = new THREE.PerspectiveCamera(chessComputeVFov(initialAspect), initialAspect, 0.1, 120);

    var renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
    }
    container.appendChild(renderer.domElement);

    // ============================================================
    // PROCEDURAL WOOD TEXTURES
    // ============================================================
    function makeWoodTexture(base, grain, streaky){
      var size = 512;
      var c = document.createElement("canvas");
      c.width = size; c.height = size;
      var ctx = c.getContext("2d");
      ctx.fillStyle = base;
      ctx.fillRect(0,0,size,size);
      var lines = streaky ? 46 : 90;
      for (var i=0;i<lines;i++){
        ctx.strokeStyle = grain;
        ctx.globalAlpha = 0.05 + Math.random()*0.13;
        ctx.lineWidth = 0.6 + Math.random()*2.2;
        ctx.beginPath();
        var y = Math.random()*size;
        ctx.moveTo(0,y);
        for (var x=0; x<=size; x+=28){
          y += (Math.random()-0.5)* (streaky ? 10 : 20);
          ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      var grad = ctx.createLinearGradient(0,0,size,size);
      grad.addColorStop(0,"rgba(255,255,255,0.08)");
      grad.addColorStop(0.5,"rgba(255,255,255,0)");
      grad.addColorStop(1,"rgba(0,0,0,0.10)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,size,size);
      var tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    var lightWoodTex = makeWoodTexture("#d9b87a", "#8f6530", false);
    var darkWoodTex  = makeWoodTexture("#55311c", "#2a180b", false);
    var frameTex = makeWoodTexture("#3a2213", "#1c0f08", true);
    frameTex.repeat.set(3,1);

    function makeRadialWoodTexture(base, grain, dark){
      var size = 1024, cx = size/2, cy = size/2;
      var c = document.createElement("canvas");
      c.width = size; c.height = size;
      var ctx = c.getContext("2d");

      // base fill with gentle color drift
      var baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size*0.72);
      baseGrad.addColorStop(0, base);
      baseGrad.addColorStop(1, dark);
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0,0,size,size);

      // concentric growth rings, slightly jittered for organic feel
      var maxR = size*0.7;
      var r = 6;
      while (r < maxR){
        var jitter = 6 + Math.random()*10;
        ctx.beginPath();
        var steps = 90;
        for (var i=0;i<=steps;i++){
          var a = (i/steps)*Math.PI*2;
          var rr = r + Math.sin(a*5 + r*0.3)*jitter*0.4 + (Math.random()-0.5)*4;
          var x = cx + Math.cos(a)*rr;
          var y = cy + Math.sin(a)*rr;
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath();
        ctx.strokeStyle = grain;
        ctx.globalAlpha = 0.05 + Math.random()*0.10;
        ctx.lineWidth = 1 + Math.random()*2.2;
        ctx.stroke();
        r += 7 + Math.random()*10;
      }

      // a few subtle radial streaks (cathedral grain flecks)
      ctx.globalAlpha = 1;
      for (var k=0;k<26;k++){
        var ang = Math.random()*Math.PI*2;
        var len = size*0.18 + Math.random()*size*0.42;
        var startR = Math.random()*size*0.15;
        var x1 = cx + Math.cos(ang)*startR, y1 = cy + Math.sin(ang)*startR;
        var x2 = cx + Math.cos(ang)*(startR+len), y2 = cy + Math.sin(ang)*(startR+len);
        ctx.strokeStyle = grain;
        ctx.globalAlpha = 0.03 + Math.random()*0.05;
        ctx.lineWidth = 0.6 + Math.random()*1.4;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }

      // a couple of small darker knots for character
      for (var n=0;n<3;n++){
        var kx = cx + (Math.random()-0.5)*size*0.9;
        var ky = cy + (Math.random()-0.5)*size*0.9;
        var kr = 6 + Math.random()*10;
        var knotGrad = ctx.createRadialGradient(kx,ky,0,kx,ky,kr*2.2);
        knotGrad.addColorStop(0, "rgba(20,10,4,0.55)");
        knotGrad.addColorStop(1, "rgba(20,10,4,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = knotGrad;
        ctx.beginPath(); ctx.ellipse(kx,ky,kr*2.2,kr*1.4,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
      }

      // soft polished sheen falloff (brighter center highlight, darker rim)
      var sheen = ctx.createRadialGradient(cx*0.85, cy*0.7, size*0.05, cx, cy, size*0.72);
      sheen.addColorStop(0, "rgba(255,246,220,0.16)");
      sheen.addColorStop(0.45, "rgba(255,246,220,0.03)");
      sheen.addColorStop(1, "rgba(0,0,0,0.22)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = sheen;
      ctx.fillRect(0,0,size,size);

      var tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }

    var tableTex = makeRadialWoodTexture("#6b4327", "#3c2413", "#2c1a0e");

    // ============================================================
    // FLOOR (grounds the table with soft ambient occlusion)
    // ============================================================
    var floorTex = makeWoodTexture("#241713", "#120a08", true);
    floorTex.repeat.set(10,10);
    var floorGeo = new THREE.PlaneGeometry(60, 60);
    var floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.02 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -1.35;
    floor.receiveShadow = true;
    scene.add(floor);

    // soft contact-shadow blob beneath the table for grounding
    function makeAOTexture(){
      var size = 512;
      var c = document.createElement("canvas");
      c.width = size; c.height = size;
      var ctx = c.getContext("2d");
      var g = ctx.createRadialGradient(size/2,size/2,size*0.30,size/2,size/2,size*0.5);
      g.addColorStop(0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.7, "rgba(0,0,0,0.22)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,size,size);
      return new THREE.CanvasTexture(c);
    }
    var aoDisc = new THREE.Mesh(
      new THREE.CircleGeometry(11.5, 64),
      new THREE.MeshBasicMaterial({ map: makeAOTexture(), transparent:true, depthWrite:false })
    );
    aoDisc.rotation.x = -Math.PI/2;
    aoDisc.position.y = -1.34;
    scene.add(aoDisc);

    // ============================================================
    // TABLE
    // ============================================================
    var tableGeo = new THREE.CylinderGeometry(9.2, 9.6, 0.5, 96);
    var tableMat = new THREE.MeshPhysicalMaterial({
      map: tableTex, roughness: 0.22, metalness: 0.06,
      clearcoat: 0.55, clearcoatRoughness: 0.16, reflectivity: 0.5
    });
    var table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.42;
    table.receiveShadow = true;
    table.castShadow = true;
    scene.add(table);

    // subtle table rim highlight
    var rimGeo = new THREE.TorusGeometry(9.2, 0.06, 12, 96);
    var rimMat = new THREE.MeshStandardMaterial({ color:0x8a6a3a, metalness:0.75, roughness:0.22 });
    var rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI/2;
    rim.position.y = -0.17;
    rim.castShadow = true;
    scene.add(rim);

    // pedestal base so the table reads as a real piece of furniture, not a floating disc
    var pedestalMat = new THREE.MeshStandardMaterial({ map: frameTex, roughness: 0.4, metalness: 0.1 });
    var pedestalCol = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 1.05, 0.62, 24), pedestalMat);
    pedestalCol.position.y = -1.0;
    pedestalCol.castShadow = true; pedestalCol.receiveShadow = true;
    scene.add(pedestalCol);
    var pedestalFoot = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.85, 0.14, 32), pedestalMat);
    pedestalFoot.position.y = -1.28;
    pedestalFoot.castShadow = true; pedestalFoot.receiveShadow = true;
    scene.add(pedestalFoot);

    // ============================================================
    // BOARD (8x8 squares + frame)
    // ============================================================
    var boardGroup = new THREE.Group();
    scene.add(boardGroup);

    function algebraic(col,row){ return FILES[col] + (8-row); }
    function squareToColRow(sq){ return { col: FILES.indexOf(sq[0]), row: 8 - parseInt(sq[1],10) }; }
    function squareWorldPos(sq){
      var cr = squareToColRow(sq);
      return new THREE.Vector3(cr.col - 3.5, 0.035, cr.row - 3.5);
    }

    var tileGeo = new THREE.BoxGeometry(0.985, 0.07, 0.985);
    for (var row=0; row<8; row++){
      for (var col=0; col<8; col++){
        var isLight = (row+col) % 2 === 0;
        var mat = new THREE.MeshStandardMaterial({
          map: isLight ? lightWoodTex : darkWoodTex,
          roughness: isLight ? 0.28 : 0.34,
          metalness: 0.06
        });
        var tile = new THREE.Mesh(tileGeo, mat);
        var sq = algebraic(col,row);
        tile.position.set(col-3.5, 0, row-3.5);
        tile.receiveShadow = true;
        tile.userData.square = sq;
        tile.userData.isPiece = false;
        boardGroup.add(tile);
        squareBaseMeshes[sq] = tile;
      }
    }

    // frame around the board
    var frameMat = new THREE.MeshStandardMaterial({ map: frameTex, roughness:0.35, metalness:0.1 });
    var frameThickness = 0.55;
    var frameOuter = 8 + frameThickness*2;
    function makeFrameBar(w,d,x,z){
      var geo = new THREE.BoxGeometry(w, 0.22, d);
      var m = new THREE.Mesh(geo, frameMat);
      m.position.set(x, 0.02, z);
      m.castShadow = true; m.receiveShadow = true;
      return m;
    }
    boardGroup.add(makeFrameBar(frameOuter, frameThickness, 0,  (8+frameThickness)/2));
    boardGroup.add(makeFrameBar(frameOuter, frameThickness, 0, -(8+frameThickness)/2));
    boardGroup.add(makeFrameBar(frameThickness, 8, (8+frameThickness)/2, 0));
    boardGroup.add(makeFrameBar(frameThickness, 8, -(8+frameThickness)/2, 0));

    // gold inlay line between frame and board
    var inlayGeo = new THREE.RingGeometry(4.02, 4.08, 4, 1);
    // (skip - decorative torus border instead)
    var inlay = new THREE.Mesh(new THREE.TorusGeometry(5.66, 0.02, 6, 4), new THREE.MeshStandardMaterial({color:0xc9a24a, metalness:0.85, roughness:0.25}));
    inlay.rotation.x = Math.PI/2;
    inlay.rotation.z = Math.PI/4;
    inlay.scale.set(1, 1.0, 1);
    inlay.position.y = 0.10;
    boardGroup.add(inlay);

    // ============================================================
    // PIECE GEOMETRY FACTORY
    // ============================================================
    function lathePart(points, mat){
      var pts = points.map(function(p){ return new THREE.Vector2(p[0], p[1]); });
      var geo = new THREE.LatheGeometry(pts, 28);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      return mesh;
    }

    function buildPawn(mat){
      var g = new THREE.Group();
      g.add(lathePart([[0.30,0],[0.32,0.04],[0.29,0.09],[0.19,0.15],[0.15,0.32],[0.21,0.38],[0.23,0.42],[0.13,0.48],[0.19,0.52]], mat));
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.165,20,16), mat);
      head.position.y = 0.63; head.castShadow = true;
      g.add(head);
      return g;
    }

    function buildRook(mat){
      var g = new THREE.Group();
      g.add(lathePart([[0.34,0],[0.36,0.05],[0.33,0.10],[0.23,0.17],[0.21,0.46],[0.29,0.51],[0.31,0.56]], mat));
      var rimC = new THREE.Mesh(new THREE.CylinderGeometry(0.33,0.33,0.08,24), mat);
      rimC.position.y = 0.60; rimC.castShadow = true;
      g.add(rimC);
      var count = 8;
      for (var i=0;i<count;i++){
        var a = (i/count)*Math.PI*2;
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.115,0.11,0.115), mat);
        m.position.set(Math.cos(a)*0.27, 0.695, Math.sin(a)*0.27);
        m.castShadow = true;
        g.add(m);
      }
      return g;
    }

    function buildBishop(mat){
      var g = new THREE.Group();
      g.add(lathePart([[0.30,0],[0.32,0.05],[0.29,0.10],[0.19,0.17],[0.13,0.52],[0.19,0.60],[0.09,0.72],[0.05,0.84]], mat));
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.105,0.018,10,20), mat);
      ring.rotation.x = Math.PI/2; ring.position.y = 0.80; ring.castShadow = true;
      g.add(ring);
      var top = new THREE.Mesh(new THREE.SphereGeometry(0.085,16,14), mat);
      top.position.y = 0.92; top.castShadow = true;
      g.add(top);
      var notch = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.10,0.15), mat);
      notch.position.y = 0.99; notch.rotation.z = 0.55; notch.castShadow = true;
      g.add(notch);
      return g;
    }

    function buildKnight(mat){
      var g = new THREE.Group();
      g.add(lathePart([[0.30,0],[0.32,0.05],[0.29,0.10],[0.21,0.16],[0.19,0.28]], mat));
      var shape = new THREE.Shape();
      shape.moveTo(-0.15,0.28);
      shape.quadraticCurveTo(-0.22,0.44,-0.11,0.58);
      shape.quadraticCurveTo(-0.07,0.67,0.05,0.72);
      shape.quadraticCurveTo(0.21,0.75,0.28,0.67);
      shape.quadraticCurveTo(0.32,0.63,0.28,0.58);
      shape.quadraticCurveTo(0.23,0.60,0.19,0.57);
      shape.quadraticCurveTo(0.25,0.52,0.22,0.47);
      shape.quadraticCurveTo(0.16,0.51,0.12,0.47);
      shape.quadraticCurveTo(0.15,0.39,0.08,0.33);
      shape.quadraticCurveTo(0.00,0.28,-0.06,0.31);
      shape.quadraticCurveTo(-0.11,0.26,-0.15,0.28);
      var extrudeSettings = { depth:0.17, bevelEnabled:true, bevelThickness:0.014, bevelSize:0.014, bevelSegments:2, curveSegments:12 };
      var headGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      headGeo.translate(0,0,-0.085);
      var head = new THREE.Mesh(headGeo, mat);
      head.rotation.y = Math.PI/2;
      head.castShadow = true;
      g.add(head);
      return g;
    }

    function buildQueen(mat){
      var g = new THREE.Group();
      g.add(lathePart([[0.36,0],[0.38,0.05],[0.35,0.10],[0.24,0.18],[0.18,0.58],[0.25,0.66],[0.29,0.76],[0.18,0.84],[0.24,0.90]], mat));
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.20,0.03,10,24), mat);
      ring.rotation.x = Math.PI/2; ring.position.y = 0.94; ring.castShadow = true;
      g.add(ring);
      var spikeCount = 8;
      for (var i=0;i<spikeCount;i++){
        var a = (i/spikeCount)*Math.PI*2;
        var spike = new THREE.Mesh(new THREE.ConeGeometry(0.035,0.16,8), mat);
        spike.position.set(Math.cos(a)*0.19, 1.02, Math.sin(a)*0.19);
        spike.castShadow = true;
        g.add(spike);
      }
      var top = new THREE.Mesh(new THREE.SphereGeometry(0.075,16,14), mat);
      top.position.y = 1.10; top.castShadow = true;
      g.add(top);
      return g;
    }

    function buildKing(mat){
      var g = new THREE.Group();
      g.add(lathePart([[0.38,0],[0.40,0.05],[0.37,0.10],[0.26,0.19],[0.20,0.64],[0.27,0.72],[0.31,0.82],[0.21,0.90],[0.27,0.96]], mat));
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.22,0.032,10,24), mat);
      ring.rotation.x = Math.PI/2; ring.position.y = 1.00; ring.castShadow = true;
      g.add(ring);
      var base = new THREE.Mesh(new THREE.SphereGeometry(0.09,16,14), mat);
      base.position.y = 1.10; base.castShadow = true;
      g.add(base);
      var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.035,0.20,0.035), mat);
      crossV.position.y = 1.26; crossV.castShadow = true;
      g.add(crossV);
      var crossH = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.035,0.035), mat);
      crossH.position.y = 1.22; crossH.castShadow = true;
      g.add(crossH);
      return g;
    }

    var PIECE_BUILDERS = { p:buildPawn, r:buildRook, n:buildKnight, b:buildBishop, q:buildQueen, k:buildKing };

    var whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xefe4c8, metalness: 0.12, roughness: 0.32,
      clearcoat: 0.4, clearcoatRoughness: 0.28, reflectivity: 0.4
    });
    var blackMat = new THREE.MeshPhysicalMaterial({
      color: 0x362820, metalness: 0.34, roughness: 0.4,
      clearcoat: 0.34, clearcoatRoughness: 0.3, reflectivity: 0.42
    });

    var PIECE_SCALE = 0.72;

    function createPieceMesh(type, color){
      var mat = color === "w" ? whiteMat : blackMat;
      var group = PIECE_BUILDERS[type](mat);
      group.scale.set(PIECE_SCALE, PIECE_SCALE, PIECE_SCALE);
      group.traverse(function(o){ o.userData.isPiece = true; o.userData.pieceColor = color; o.userData.pieceType = type; });
      return group;
    }

    var piecesGroup = new THREE.Group();
    scene.add(piecesGroup);

    function disposeObject(obj){
      obj.traverse(function(o){
        if (o.geometry) o.geometry.dispose();
      });
    }

    function rebuildAllPieces(){
      while (piecesGroup.children.length){
        var c = piecesGroup.children.pop();
        disposeObject(c);
      }
      squareMeshMap = {};
      var board = game.board();
      for (var r=0; r<8; r++){
        for (var c2=0; c2<8; c2++){
          var cell = board[r][c2];
          if (!cell) continue;
          var sq = algebraic(c2, r);
          var mesh = createPieceMesh(cell.type, cell.color);
          var pos = squareWorldPos(sq);
          mesh.position.copy(pos);
          mesh.traverse(function(o){ o.userData.square = sq; });
          piecesGroup.add(mesh);
          squareMeshMap[sq] = mesh;
        }
      }
    }
    rebuildAllPieces();

    // ============================================================
    // HIGHLIGHTS (selection halo + legal move markers)
    // ============================================================
    var highlightGroup = new THREE.Group();
    scene.add(highlightGroup);

    function makeRing(radiusIn, radiusOut, color, opacity){
      var geo = new THREE.RingGeometry(radiusIn, radiusOut, 40);
      var mat = new THREE.MeshBasicMaterial({ color: color, transparent:true, opacity: opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite:false });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI/2;
      return mesh;
    }
    function makeDisc(radius, color, opacity){
      var geo = new THREE.CircleGeometry(radius, 32);
      var mat = new THREE.MeshBasicMaterial({ color: color, transparent:true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite:false });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI/2;
      return mesh;
    }

    function renderHighlights(){
      while (highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);

      if (selectedSquare){
        var p = squareWorldPos(selectedSquare);
        var haloOuter = makeRing(0.30, 0.46, 0x9b4dff, 0.55);
        haloOuter.position.set(p.x, 0.075, p.z);
        haloOuter.userData.pulse = true;
        highlightGroup.add(haloOuter);
        var haloFill = makeDisc(0.30, 0xb26bff, 0.16);
        haloFill.position.set(p.x, 0.07, p.z);
        highlightGroup.add(haloFill);
      }
      legalTargets.forEach(function(t){
        var pos = squareWorldPos(t);
        var isCapture = !!game.get(t);
        var color = isCapture ? 0xf5745a : 0x4ade80;
        var ring = makeRing(0.34, 0.40, color, 0.85);
        ring.position.set(pos.x, 0.07, pos.z);
        highlightGroup.add(ring);
        if (!isCapture){
          var dot = makeDisc(0.11, color, 0.75);
          dot.position.set(pos.x, 0.07, pos.z);
          highlightGroup.add(dot);
        }
      });
    }

    // ============================================================
    // CAPTURED PANEL RENDER
    // ============================================================
    var capturedWhiteEl = document.getElementById("chess-captured-white-grid");
    var capturedBlackEl = document.getElementById("chess-captured-black-grid");

    function renderCapturedPanels(){
      capturedWhiteEl.innerHTML = "";
      capturedBlack; // no-op reference
      capturedWhite.forEach(function(t){
        var span = document.createElement("span");
        span.className = "glyph white-piece";
        span.textContent = PIECE_GLYPH.w[t];
        capturedWhiteEl.appendChild(span);
      });
      capturedBlackEl.innerHTML = "";
      capturedBlack.forEach(function(t){
        var span = document.createElement("span");
        span.className = "glyph black-piece";
        span.textContent = PIECE_GLYPH.b[t];
        capturedBlackEl.appendChild(span);
      });
    }

    // ============================================================
    // LIGHTING
    // ============================================================
    var ambient = new THREE.AmbientLight(0xfff2dc, 0.46);
    scene.add(ambient);

    var hemi = new THREE.HemisphereLight(0xfff6e6, 0x1c130c, 0.44);
    scene.add(hemi);

    var dirLight = new THREE.DirectionalLight(0xfff1d6, 1.15);
    dirLight.position.set(6, 11, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -9;
    dirLight.shadow.camera.right = 9;
    dirLight.shadow.camera.top = 9;
    dirLight.shadow.camera.bottom = -9;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.bias = -0.0015;
    scene.add(dirLight);

    var spot = new THREE.SpotLight(0xffe3ad, 0.9, 34, Math.PI/6.2, 0.45, 1.4);
    spot.position.set(-5, 10, -3);
    spot.target.position.set(0,0,0);
    spot.castShadow = false;
    scene.add(spot);
    scene.add(spot.target);

    var fillLight = new THREE.PointLight(0xb9c9ff, 0.18, 20);
    fillLight.position.set(0, 5, -8);
    scene.add(fillLight);

    // ============================================================
    // CAMERA CONTROLS (custom lightweight orbit/pan/zoom)
    // ============================================================
    // Siyah oynayan kişi tahtayı karşı taraftan görmeli (kendi taşları ona yakın dursun).
    var CHESS_HOME_THETA = (window.chessMyColor === 'b') ? Math.PI : 0.0;
    (function(){
      var dbg = document.getElementById('chessCameraDebug');
      if(dbg) dbg.textContent = 'ben: ' + (window.chessMyColor || '?') + ' | theta: ' + CHESS_HOME_THETA.toFixed(2);
    })();
    var camState = {
      theta: CHESS_HOME_THETA,
      phi: 0.55,
      radius: 30,
      targetTheta: CHESS_HOME_THETA,
      targetPhi: 0.55,
      targetRadius: 30
    };
    var camTargetPoint = new THREE.Vector3(0, 0.3, 0);
    var camTargetGoal = new THREE.Vector3(0, 0.3, 0);
    var camTargetHome = new THREE.Vector3(0, 0.3, 0);
    var CAM_HOME = { theta: CHESS_HOME_THETA, phi: 0.55, radius: 30 };

    var isDragging = false, lastX=0, lastY=0;
    var THETA_LIMIT = 0.55;   // sağa/sola en fazla bu kadar (radyan)
    var PHI_MIN = 0.40;       // yukarı bakış sınırı
    var PHI_MAX = 0.92;       // aşağı bakış sınırı

    renderer.domElement.addEventListener("contextmenu", function(e){ e.preventDefault(); });

    renderer.domElement.addEventListener("pointerdown", function(e){
      isDragging = true;
      lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    });
    renderer.domElement.addEventListener("pointerup", function(e){
      isDragging = false;
      handlePointerClick(e);
    });
    renderer.domElement.addEventListener("pointercancel", function(){ isDragging=false; });

    var dragMoved = false;
    renderer.domElement.addEventListener("pointermove", function(e){
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      if (isDragging){
        if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
        camState.targetTheta -= dx * 0.0022;
        camState.targetPhi   -= dy * 0.0018;
        camState.targetTheta = Math.max(CAM_HOME.theta - THETA_LIMIT, Math.min(CAM_HOME.theta + THETA_LIMIT, camState.targetTheta));
        camState.targetPhi   = Math.max(PHI_MIN, Math.min(PHI_MAX, camState.targetPhi));
      } else {
        dragMoved = false;
      }
      lastX = e.clientX; lastY = e.clientY;
      updateHover(e);
    });

    renderer.domElement.addEventListener("wheel", function(e){
      e.preventDefault();
      camState.targetRadius *= (1 + e.deltaY * 0.0011);
      camState.targetRadius = Math.max(8, Math.min(46, camState.targetRadius));
    }, { passive:false });

    function zoomCamera(factor){
      camState.targetRadius *= factor;
      camState.targetRadius = Math.max(8, Math.min(46, camState.targetRadius));
    }
    window.chessZoomIn = function(){ zoomCamera(0.85); };
    window.chessZoomOut = function(){ zoomCamera(1.18); };

    function resetCamera(){
      camState.targetTheta = CAM_HOME.theta;
      camState.targetPhi = CAM_HOME.phi;
      camState.targetRadius = CAM_HOME.radius;
      camTargetGoal.copy(camTargetHome);
    }

    function updateCamera(){
      camState.theta += (camState.targetTheta - camState.theta) * 0.055;
      camState.phi   += (camState.targetPhi   - camState.phi)   * 0.055;
      camState.radius+= (camState.targetRadius- camState.radius)* 0.08;
      camTargetPoint.lerp(camTargetGoal, 0.06);

      camera.position.x = camTargetPoint.x + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.z = camTargetPoint.z + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.position.y = camTargetPoint.y + camState.radius * Math.cos(camState.phi);
      camera.lookAt(camTargetPoint);
    }

    // ============================================================
    // RAYCAST INTERACTION
    // ============================================================
    var raycaster = new THREE.Raycaster();
    var pointerNDC = new THREE.Vector2();

    function getIntersectSquare(clientX, clientY){
      var rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      var targets = piecesGroup.children.concat(boardGroup.children);
      var hits = raycaster.intersectObjects(targets, true);
      for (var i=0;i<hits.length;i++){
        var o = hits[i].object;
        if (o.userData && o.userData.square) return o.userData.square;
      }
      return null;
    }

    function updateHover(e){
      if (animating) { renderer.domElement.style.cursor = "default"; return; }
      var sq = getIntersectSquare(e.clientX, e.clientY);
      if (!sq) { renderer.domElement.style.cursor = "default"; return; }
      var piece = game.get(sq);
      var clickable = (piece && piece.color === game.turn()) || legalTargets.indexOf(sq) !== -1;
      renderer.domElement.style.cursor = clickable ? "pointer" : "default";
    }

    function handlePointerClick(e){
      if (dragMoved) { dragMoved = false; return; }
      if (animating) return;
      var sq = getIntersectSquare(e.clientX, e.clientY);
      if (!sq) { clearSelection(); return; }
      handleSquareClick(sq);
    }

    function handleSquareClick(sq){
      if (window.chessMyColor && game.turn() !== window.chessMyColor) return; // sıra sende değil
      var piece = game.get(sq);
      if (selectedSquare){
        if (legalTargets.indexOf(sq) !== -1){
          doMove(selectedSquare, sq);
          clearSelection();
          return;
        }
        if (piece && piece.color === game.turn() && (!window.chessMyColor || piece.color === window.chessMyColor)){
          selectSquare(sq);
          return;
        }
        clearSelection();
        return;
      } else {
        if (piece && piece.color === game.turn() && (!window.chessMyColor || piece.color === window.chessMyColor)){
          selectSquare(sq);
        }
      }
    }

    function selectSquare(sq){
      selectedSquare = sq;
      var moves = game.moves({ square: sq, verbose:true });
      var seen = {};
      legalTargets = [];
      moves.forEach(function(m){ if (!seen[m.to]) { seen[m.to]=true; legalTargets.push(m.to); } });
      renderHighlights();
    }

    function clearSelection(){
      selectedSquare = null;
      legalTargets = [];
      renderHighlights();
    }

    // ============================================================
    // MOVE ANIMATION
    // ============================================================
    function easeInOutQuad(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }

    function animateArc(mesh, fromPos, toPos, duration, onComplete){
      var start = performance.now();
      var arcHeight = 0.85;
      function step(now){
        var t = Math.min(1, (now - start) / duration);
        var e = easeInOutQuad(t);
        mesh.position.x = fromPos.x + (toPos.x - fromPos.x) * e;
        mesh.position.z = fromPos.z + (toPos.z - fromPos.z) * e;
        mesh.position.y = fromPos.y + (toPos.y - fromPos.y) * e + Math.sin(Math.PI * t) * arcHeight;
        mesh.rotation.z = Math.sin(Math.PI * t) * 0.05;
        if (t < 1){
          requestAnimationFrame(step);
        } else {
          mesh.position.copy(toPos);
          mesh.rotation.z = 0;
          if (onComplete) onComplete();
        }
      }
      requestAnimationFrame(step);
    }

    function animateCaptureRemoval(mesh, color, type){
      var start = performance.now();
      var duration = 420;
      var fromPos = mesh.position.clone();
      var toPos = fromPos.clone().add(new THREE.Vector3(0, 1.4, 0));
      function step(now){
        var t = Math.min(1, (now-start)/duration);
        mesh.position.lerpVectors(fromPos, toPos, t);
        var s = PIECE_SCALE * (1 - t);
        mesh.scale.set(s,s,s);
        mesh.rotation.y += 0.15;
        if (t < 1){
          requestAnimationFrame(step);
        } else {
          piecesGroup.remove(mesh);
          disposeObject(mesh);
        }
      }
      requestAnimationFrame(step);
      if (color === "w"){ capturedWhite.push(type); } else { capturedBlack.push(type); }
      renderCapturedPanels();
    }

    function removeLastCaptured(color, type){
      var arr = color === "w" ? capturedWhite : capturedBlack;
      var idx = -1;
      for (var i=arr.length-1;i>=0;i--){ if (arr[i]===type){ idx=i; break; } }
      if (idx === -1) idx = arr.length-1;
      if (idx >= 0) arr.splice(idx,1);
      renderCapturedPanels();
    }

    function doMove(from, to, isRemote){
      var pieceInfo = game.get(from);
      if (!pieceInfo) return;
      var promotion;
      if (pieceInfo.type === "p" && (to[1] === "8" || to[1] === "1")) promotion = "q";

      var willCaptureEP = false;
      if (pieceInfo.type === "p" && !game.get(to) && from[0] !== to[0]) willCaptureEP = true;

      var moveObj = game.move({ from:from, to:to, promotion:promotion });
      if (!moveObj) return;

      animating = true;
      var didCapture = willCaptureEP || !!moveObj.captured;
      if (window.chessPlaySound) window.chessPlaySound(didCapture ? 'capture' : pieceInfo.type);

      // Handle captures visually BEFORE moving the capturing piece
      if (willCaptureEP || (moveObj.flags && moveObj.flags.indexOf("e") !== -1)){
        var capSq = to[0] + from[1];
        var capMesh = squareMeshMap[capSq];
        if (capMesh){
          delete squareMeshMap[capSq];
          animateCaptureRemoval(capMesh, moveObj.color === "w" ? "b" : "w", "p");
        }
      } else if (moveObj.captured){
        var capMesh2 = squareMeshMap[to];
        if (capMesh2){
          delete squareMeshMap[to];
          animateCaptureRemoval(capMesh2, moveObj.color === "w" ? "b" : "w", moveObj.captured);
        }
      }

      var mesh = squareMeshMap[from];
      delete squareMeshMap[from];
      squareMeshMap[to] = mesh;
      var fromPos = squareWorldPos(from);
      var toPos = squareWorldPos(to);

      animateArc(mesh, fromPos, toPos, 520, function(){
        mesh.traverse(function(o){ o.userData.square = to; });

        var isCastle = moveObj.flags && (moveObj.flags.indexOf("k") !== -1 || moveObj.flags.indexOf("q") !== -1);
        var isPromo = moveObj.flags && moveObj.flags.indexOf("p") !== -1;

        if (isCastle){
          var rank = from[1];
          var kingSide = moveObj.flags.indexOf("k") !== -1;
          var rookFrom = kingSide ? ("h"+rank) : ("a"+rank);
          var rookTo = kingSide ? ("f"+rank) : ("d"+rank);
          var rookMesh = squareMeshMap[rookFrom];
          if (rookMesh){
            delete squareMeshMap[rookFrom];
            squareMeshMap[rookTo] = rookMesh;
            var rFromPos = squareWorldPos(rookFrom);
            var rToPos = squareWorldPos(rookTo);
            animateArc(rookMesh, rFromPos, rToPos, 480, function(){
              rookMesh.traverse(function(o){ o.userData.square = rookTo; });
              finalizeMove(moveObj, to, isRemote);
            });
          } else {
            finalizeMove(moveObj, to, isRemote);
          }
        } else if (isPromo){
          piecesGroup.remove(mesh);
          disposeObject(mesh);
          var newMesh = createPieceMesh("q", moveObj.color);
          newMesh.position.copy(toPos);
          newMesh.traverse(function(o){ o.userData.square = to; });
          piecesGroup.add(newMesh);
          squareMeshMap[to] = newMesh;
          finalizeMove(moveObj, to, isRemote);
        } else {
          finalizeMove(moveObj, to, isRemote);
        }
      });
    }

    function finalizeMove(moveObj, toSquare, isRemote){
      animating = false;
      updateStatus();
      startMoveTimer();
      if (game.game_over() && typeof stopChessVoice === 'function') stopChessVoice(); // oyun bittiyse sesli sohbeti de kapat
      if (!isRemote && window.chessSyncMove) window.chessSyncMove(moveObj, game.fen(), capturedWhite, capturedBlack);
    }

    // ============================================================
    // STATUS / TURN UI
    // ============================================================
    var turnDotEl = document.getElementById("chess-turn-dot");
    var turnTextEl = document.getElementById("chess-turn-text");
    var statusTextEl = document.getElementById("chess-status-text");
    var timerEl = document.getElementById("chess-timer");

    function updateStatus(){
      var turn = game.turn();
      turnDotEl.style.background = turn === "b" ? "radial-gradient(circle at 35% 30%, #4a3a2c, #100b08)" : "radial-gradient(circle at 35% 30%, #fff8e8, #d8c79a)";
      turnTextEl.textContent = turn === "w" ? "Beyaz Sırası" : "Siyah Sırası";

      var extra = "";
      if (game.in_checkmate()){
        var winner = turn === "w" ? "Siyah" : "Beyaz";
        extra = "Şah Mat! " + winner + " kazandı.";
      } else if (game.in_stalemate()){
        extra = "Pat! Oyun berabere.";
      } else if (game.in_threefold_repetition()){
        extra = "Berabere (üç tekrar).";
      } else if (game.insufficient_material && game.insufficient_material()){
        extra = "Berabere (yetersiz materyal).";
      } else if (game.in_draw()){
        extra = "Berabere.";
      } else if (game.in_check()){
        extra = "Şah!";
      }
      statusTextEl.textContent = extra;
    }
    updateStatus();
    renderCapturedPanels();

    // ============================================================
    // HAMLE SÜRESİ (30 SANİYE) — süre dolarsa sıradaki oyuncu için
    // rastgele bir hamle otomatik oynanır, oyun durmaz.
    // ============================================================
    var MOVE_TIME_LIMIT = 30;
    var moveTimerRemaining = MOVE_TIME_LIMIT;
    var moveTimerIntervalId = null;
    var moveTimerEl = document.getElementById("chess-move-timer");

    function updateMoveTimerDisplay(){
      if (!moveTimerEl) return;
      moveTimerEl.textContent = moveTimerRemaining + "s";
      moveTimerEl.style.color = moveTimerRemaining <= 10 ? "#f5745a" : "#c9a24a";
    }

    function startMoveTimer(){
      if (moveTimerIntervalId){ clearInterval(moveTimerIntervalId); moveTimerIntervalId = null; }
      if (game.game_over()){ if (moveTimerEl) moveTimerEl.textContent = "-"; return; }
      moveTimerRemaining = MOVE_TIME_LIMIT;
      updateMoveTimerDisplay();
      moveTimerIntervalId = setInterval(function(){
        moveTimerRemaining--;
        updateMoveTimerDisplay();
        if (moveTimerRemaining <= 0){
          clearInterval(moveTimerIntervalId);
          moveTimerIntervalId = null;
          handleMoveTimeout();
        }
      }, 1000);
    }

    function handleMoveTimeout(){
      if (animating){ setTimeout(handleMoveTimeout, 300); return; } // hamle animasyonu bitene kadar bekle
      if (game.game_over()) return;
      var myTurn = !window.chessMyColor || window.chessMyColor === game.turn();
      if (!myTurn) return; // rakibin sırası: onun süresi kendi cihazında işliyor, biz karışmayız
      var moves = game.moves({ verbose:true });
      if (moves.length === 0) return;
      var m = moves[Math.floor(Math.random()*moves.length)];
      if (typeof showToast === 'function') showToast('Süre doldu, otomatik hamle yapıldı ⏱️');
      doMove(m.from, m.to);
    }
    startMoveTimer();

    function updateTimer(){
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      var mm = String(Math.floor(elapsed/60)).padStart(2,"0");
      var ss = String(elapsed % 60).padStart(2,"0");
      timerEl.textContent = mm + ":" + ss;
    }
    setInterval(updateTimer, 1000);

    // ============================================================
    // BUTTONS
    // ============================================================
    document.getElementById("btn-chess-reset-cam").addEventListener("click", resetCamera);
    document.getElementById("btn-chess-zoom-in").addEventListener("click", function(){ zoomCamera(0.85); });
    document.getElementById("btn-chess-zoom-out").addEventListener("click", function(){ zoomCamera(1.18); });

    // ============================================================
    // RESIZE
    // ============================================================
    function onChessResize(){
      var aspect = container.clientWidth / container.clientHeight;
      camera.aspect = aspect;
      camera.fov = chessComputeVFov(aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onChessResize);

    // ============================================================
    // MAIN LOOP
    // ============================================================
    var clock = new THREE.Clock();
    var chessAnimFrameId = null;
    function animate(){
      chessAnimFrameId = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      updateCamera();
      highlightGroup.children.forEach(function(h){
        if (h.userData.pulse){
          var s = 1 + Math.sin(t*3.2)*0.08;
          h.scale.set(s,s,s);
          h.material.opacity = 0.45 + Math.sin(t*3.2)*0.15;
        }
      });
      spot.target.position.set(camTargetPoint.x*0.3, 0, camTargetPoint.z*0.3);
      renderer.render(scene, camera);
    }
    animate();

    // initial camera snap
    camState.theta = CAM_HOME.theta; camState.phi = CAM_HOME.phi; camState.radius = CAM_HOME.radius;
    camTargetPoint.copy(camTargetHome);

    // hide loading overlay
    // (yükleme göstergesi bu ekranda yok, gerek yok)

    // ============================================================
    // ÇOK OYUNCULU SENKRONİZASYON İÇİN DIŞA AÇILAN FONKSİYONLAR
    // ============================================================
    window.chessApplyRemoteMove = function(from, to){
      if (animating) { setTimeout(function(){ window.chessApplyRemoteMove(from, to); }, 150); return; }
      doMove(from, to, true);
    };
    window.chessGetFen = function(){ return game.fen(); };
    window.chessGetGameOverInfo = function(){
      if (game.in_checkmate()) return { over:true, winnerColor: game.turn() === 'w' ? 'b' : 'w' };
      if (game.in_stalemate() || game.in_threefold_repetition() || (game.insufficient_material && game.insufficient_material()) || game.in_draw()) return { over:true, winnerColor: null };
      return { over:false, winnerColor: null };
    };
    window.chessLoadFen = function(fen, capW, capB){
      game.load(fen);
      capturedWhite = capW || [];
      capturedBlack = capB || [];
      clearSelection();
      rebuildAllPieces();
      renderCapturedPanels();
      updateStatus();
      startMoveTimer();
    };
    window.chessSetResigned = function(winnerColorName){
      statusTextEl.textContent = winnerColorName + " kazandı (rakip teslim oldu).";
      if (moveTimerIntervalId){ clearInterval(moveTimerIntervalId); moveTimerIntervalId = null; }
      if (typeof stopChessVoice === 'function') stopChessVoice(); // oyun bittiyse sesli sohbeti de kapat
    };
    window.chessDisposeScene = function(){
      if (moveTimerIntervalId){ clearInterval(moveTimerIntervalId); moveTimerIntervalId = null; }
      window.removeEventListener("resize", onChessResize);
      cancelAnimationFrame(chessAnimFrameId);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }


// ================= SATRANÇ (3D, çok oyunculu) =================
let chessLibsLoaded = false;
function loadChessLibs(){
  return new Promise((resolve, reject) => {
    if (chessLibsLoaded || (typeof THREE !== 'undefined' && typeof Chess !== 'undefined')) {
      chessLibsLoaded = true; resolve(); return;
    }
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
      s2.onload = () => { chessLibsLoaded = true; resolve(); };
      s2.onerror = () => reject(new Error('chess.js yüklenemedi'));
      document.head.appendChild(s2);
    };
    s1.onerror = () => reject(new Error('three.js yüklenemedi'));
    document.head.appendChild(s1);
  });
}

// ---------- Ses motoru (Web Audio API, hiç dosya gerektirmez) ----------
function makeChessSoundEngine(){
  let ctx = null;
  function ensureCtx(){
    if(!ctx){ const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, gainStart, delay, freqEnd){
    delay = delay || 0;
    const c = ensureCtx();
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator(); const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if(freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainStart, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  function noiseBurst(dur, gainStart, delay, filterFreq){
    delay = delay || 0; filterFreq = filterFreq || 1200;
    const c = ensureCtx();
    const t0 = c.currentTime + delay;
    const bufferSize = c.sampleRate * dur;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
    const src = c.createBufferSource(); src.buffer = buffer;
    const filt = c.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value = filterFreq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(gainStart, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    src.connect(filt); filt.connect(gain); gain.connect(c.destination);
    src.start(t0);
  }
  return {
    move(type){
      if(type==='p') tone(520,0.09,'sine',0.22);
      else if(type==='n'){ tone(300,0.14,'triangle',0.2,0,520); tone(180,0.1,'square',0.06,0.06); }
      else if(type==='b') tone(440,0.22,'sine',0.16,0,660);
      else if(type==='r'){ noiseBurst(0.06,0.25,0,400); tone(150,0.15,'square',0.14); }
      else if(type==='q'){ tone(660,0.18,'sine',0.16); tone(880,0.18,'sine',0.1,0.03); tone(990,0.2,'sine',0.08,0.06); }
      else if(type==='k'){ tone(220,0.35,'sawtooth',0.14); tone(110,0.4,'sine',0.16); }
    },
    capture(){
      noiseBurst(0.18,0.4,0,900);
      tone(180,0.3,'sawtooth',0.28,0.02);
      tone(90,0.35,'sine',0.3,0.03);
      tone(1200,0.08,'square',0.1,0.01);
    },
  };
}
window.chessSoundEngine = null;
window.chessPlaySound = function(type){
  if(!window.chessSoundEngine) window.chessSoundEngine = makeChessSoundEngine();
  if(type === 'capture') window.chessSoundEngine.capture();
  else window.chessSoundEngine.move(type);
};

// ---------- Navigasyon ----------
document.getElementById('btnOyunlarBack').addEventListener('click', ()=> switchScreen('ana'));
document.getElementById('oyunSatrancCard').addEventListener('click', ()=>{
  switchScreen('chess-pick-friend');
  renderChessFriendPicker();
});
document.getElementById('btnChessPickFriendBack').addEventListener('click', ()=> switchScreen('oyunlar'));

let chessFriendPickerAllUids = [];
async function renderChessFriendPicker(){
  const box = document.getElementById('chessFriendPickerList');
  box.innerHTML = '<div class="hint">Yükleniyor…</div>';
  const friendUids = await getFriendUids(currentUser.uid);
  chessFriendPickerAllUids = friendUids;
  if(friendUids.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">🤝</div><div class="msg">Önce bir arkadaş eklemen lazım.</div></div>';
    return;
  }
  renderChessFriendPickerFiltered('');
}
function renderChessFriendPickerFiltered(searchTerm){
  const box = document.getElementById('chessFriendPickerList');
  const term = (searchTerm||'').trim().toLocaleLowerCase('tr');
  const rows = chessFriendPickerAllUids.map(uid=>{
    const p = profileByUid(uid);
    const name = p ? getDisplayName(p) : 'Kullanıcı';
    const isOnline = p && p.lastActive && (Date.now() - new Date(p.lastActive).getTime()) < 120000;
    return { uid, p, name, isOnline };
  }).filter(r => !term || r.name.toLocaleLowerCase('tr').includes(term))
    .sort((a,b) => (b.isOnline - a.isOnline) || a.name.localeCompare(b.name, 'tr'));

  if(rows.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">🔍</div><div class="msg">Eşleşen arkadaş yok.</div></div>';
    return;
  }
  box.innerHTML = rows.map(({uid, p, name, isOnline})=>{
    const inner = (p && p.photoData) ? `<img src="${safeImageSrc(p.photoData)}" style="width:100%;height:100%; object-fit:cover;">` : escapeHtml(getInitials(p?p.fullName:name));
    return `<div class="toggle-row" data-chess-pick-uid="${escapeHtml(uid)}" style="cursor:pointer;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="position:relative; width:40px;height:40px;border-radius:50%; background:${(p&&p.photoData)?'transparent':avatarGradient(uid)}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; overflow:hidden; flex-shrink:0;">${inner}${isOnline?'<span style="position:absolute; bottom:-1px; right:-1px; width:11px;height:11px; border-radius:50%; background:#22C55E; border:2px solid var(--paper);"></span>':''}</div>
        <div>
          <div class="tlbl">${escapeHtml(name)}</div>
          ${isOnline?'<div style="font-size:10px; color:#16A34A; font-weight:700;">● Çevrimiçi</div>':''}
        </div>
      </div>
      <div style="color:var(--ink-soft); font-size:18px;">›</div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-chess-pick-uid]').forEach(row=>{
    row.addEventListener('click', ()=> sendChessInvite(row.dataset.chessPickUid));
  });
}
document.getElementById('chessFriendSearchInput').addEventListener('input', (e)=>{
  renderChessFriendPickerFiltered(e.target.value);
});

const CHESS_INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

async function sendChessInvite(opponentUid){
  try{
    const duelRef = await db.collection('chess_duels').add({
      player1Uid: currentUser.uid, player2Uid: opponentUid,
      fen: CHESS_INITIAL_FEN, status:'pending',
      capturedWhite: [], capturedBlack: [],
      lastMove: null, winnerUid: null, resignedBy: null,
      createdAt: new Date().toISOString()
    });
    const myName = (profile && profile.fullName) || 'Bir kullanıcı';
    await db.collection('notifications').add({
      toUid: opponentUid, fromUid: currentUser.uid, type:'chess_invite', duelId: duelRef.id,
      message: '♟️ ' + myName + ' seni satranç oynamaya davet etti!',
      read:false, createdAt:new Date().toISOString()
    });
    showToast('Satranç daveti gönderildi ♟️');
    openChessDuel(duelRef.id);
  }catch(e){ showToast('Davet gönderilemedi: '+(e.message||'')); }
}

let currentChessDuelId = null;
let currentChessInviteUnsub = null;
let currentChessGameUnsub = null;

async function openChessDuel(duelId){
  currentChessDuelId = duelId;
  switchScreen('chess-invite');
  document.getElementById('chessInviteWaiting').style.display = 'none';
  document.getElementById('chessInviteActions').style.display = 'none';
  if(currentChessInviteUnsub){ currentChessInviteUnsub(); currentChessInviteUnsub = null; }
  currentChessInviteUnsub = db.collection('chess_duels').doc(duelId).onSnapshot(async doc=>{
    if(!doc.exists) return;
    const d = doc.data();
    const isP1 = d.player1Uid === currentUser.uid;
    const opponentUid = isP1 ? d.player2Uid : d.player1Uid;
    const opponentP = profileByUid(opponentUid);
    const opponentName = opponentP ? getDisplayName(opponentP) : 'Rakip';

    if(d.status === 'pending'){
      if(isP1){
        document.getElementById('chessInviteText').textContent = opponentName + ' bekleniyor…';
        document.getElementById('chessInviteSub').textContent = 'Sen beyaz oynayacaksın.';
        document.getElementById('chessInviteWaiting').style.display = 'block';
        document.getElementById('chessInviteActions').style.display = 'none';
      } else {
        document.getElementById('chessInviteText').textContent = opponentName + ' seni satranca davet etti';
        document.getElementById('chessInviteSub').textContent = 'Sen siyah oynayacaksın.';
        document.getElementById('chessInviteWaiting').style.display = 'none';
        document.getElementById('chessInviteActions').style.display = 'flex';
      }
    } else if(d.status === 'active' || d.status === 'finished'){
      if(currentChessInviteUnsub){ currentChessInviteUnsub(); currentChessInviteUnsub = null; }
      window.chessMyColor = isP1 ? 'w' : 'b';
      await startChessGameScreen(duelId);
    }
  });
}

document.getElementById('btnChessInviteBack').addEventListener('click', ()=>{
  if(currentChessInviteUnsub){ currentChessInviteUnsub(); currentChessInviteUnsub=null; }
  switchScreen('oyunlar');
});
document.getElementById('btnChessAccept').addEventListener('click', async ()=>{
  if(!currentChessDuelId) return;
  await db.collection('chess_duels').doc(currentChessDuelId).update({ status:'active' });
});
document.getElementById('btnChessDecline').addEventListener('click', async ()=>{
  if(!currentChessDuelId) return;
  await db.collection('chess_duels').doc(currentChessDuelId).delete();
  if(currentChessInviteUnsub){ currentChessInviteUnsub(); currentChessInviteUnsub=null; }
  switchScreen('oyunlar');
});

let chessGameStarted = false;
let chessLastAppliedFen = null;

async function startChessGameScreen(duelId){
  document.querySelectorAll('main > .screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-chess-game').classList.add('active');
  document.getElementById('chess-status-text').textContent = 'Yükleniyor…';
  document.body.classList.add('chess-open'); // üstteki site başlığını gizle, tam ekran görünüm
  const navTabsEl = document.querySelector('nav.tabs');
  if(navTabsEl) navTabsEl.style.display = 'none'; // tam ekran satranç deneyimi

  await loadChessLibs();
  if(window.chessDisposeScene){ window.chessDisposeScene(); }
  chessLastAppliedFen = null;

  const isBotMode = !duelId; // duelId verilmemişse bilgisayara karşı oynuyoruz demektir
  currentChessDuelId = isBotMode ? null : duelId;
  if(!isBotMode) window.chessBotMode = false; // gerçek rakip modunda bot bayrağı eski oyundan kalmasın

  // Sesli sohbet butonu: sadece gerçek bir rakiple oynarken gösterilir, bilgisayara karşı gizli.
  window.chessOpponentUid = null;
  const voiceCallBtn = document.getElementById('btnChessVoiceCall');
  if(voiceCallBtn) voiceCallBtn.style.display = 'none';

  if(isBotMode){
    // ---- BİLGİSAYARA KARŞI: Firestore'a yazmadan, hamleden sonra botun oynamasını tetikle ----
    window.chessSyncMove = async function(moveObj, fen){
      chessLastAppliedFen = fen;
      if(window.chessGetGameOverInfo){
        const info = window.chessGetGameOverInfo();
        if(info.over) return; // oyun bitti, bot oynamasın
      }
      const turnChar = fen.split(' ')[1]; // 'w' veya 'b'
      if(turnChar === 'b'){
        setTimeout(function(){ playChessBotMove(fen); }, 550 + Math.random()*450);
      }
    };
  } else {
    // ---- GERÇEK RAKİP: Firestore üzerinden senkronize ----
    window.chessSyncMove = async function(moveObj, fen, capW, capB){
      chessLastAppliedFen = fen;
      const updateData = { fen, capturedWhite:capW, capturedBlack:capB, lastMove:{from:moveObj.from, to:moveObj.to}, updatedAt:new Date().toISOString() };
      if(window.chessGetGameOverInfo){
        const info = window.chessGetGameOverInfo();
        if(info.over){
          updateData.status = 'finished';
          if(info.winnerColor){
            const doc = await db.collection('chess_duels').doc(duelId).get();
            const d = doc.data();
            updateData.winnerUid = info.winnerColor === 'w' ? d.player1Uid : d.player2Uid;
          } else {
            updateData.winnerUid = null; // berabere
          }
        }
      }
      try{ await db.collection('chess_duels').doc(duelId).update(updateData); }catch(e){ console.error('senkron hatası', e); }
    };
  }

  initGame();
  chessGameStarted = true;

  if(currentChessGameUnsub){ currentChessGameUnsub(); currentChessGameUnsub = null; }

  if(isBotMode) return; // bilgisayar modunda Firestore dinleyicisine gerek yok

  currentChessGameUnsub = db.collection('chess_duels').doc(duelId).onSnapshot(doc=>{
    if(!doc.exists) return;
    const d = doc.data();
    if(!window.chessOpponentUid && d.player1Uid && d.player2Uid){
      window.chessOpponentUid = (d.player1Uid === currentUser.uid) ? d.player2Uid : d.player1Uid;
      if(voiceCallBtn) voiceCallBtn.style.display = 'flex';
    }
    if(d.fen !== chessLastAppliedFen){
      if(chessLastAppliedFen === null){
        chessLastAppliedFen = d.fen;
        if(window.chessLoadFen) window.chessLoadFen(d.fen, d.capturedWhite||[], d.capturedBlack||[]);
      } else if(d.lastMove){
        chessLastAppliedFen = d.fen;
        if(window.chessApplyRemoteMove) window.chessApplyRemoteMove(d.lastMove.from, d.lastMove.to);
      }
    }
    if(d.status === 'finished' && d.resignedBy && window.chessSetResigned){
      const winnerIsMe = d.winnerUid === currentUser.uid;
      window.chessSetResigned(winnerIsMe ? 'Sen' : 'Rakibin');
    }
  });
}

document.getElementById('btnChessGameBack').addEventListener('click', ()=>{
  if(currentChessGameUnsub){ currentChessGameUnsub(); currentChessGameUnsub = null; }
  window.chessBotMode = false;
  if(typeof stopChessVoice === 'function') stopChessVoice();
  const navTabsEl2 = document.querySelector('nav.tabs');
  if(navTabsEl2) navTabsEl2.style.display = 'flex';
  switchScreen('oyunlar');
});

document.getElementById('btnChessVoiceCall').addEventListener('click', ()=>{
  toggleChessVoice();
});

document.getElementById('btn-chess-resign').addEventListener('click', ()=>{
  document.getElementById('chessResignConfirmOverlay').classList.add('show');
});
document.getElementById('btnChessResignConfirmNo').addEventListener('click', ()=>{
  document.getElementById('chessResignConfirmOverlay').classList.remove('show');
});
document.getElementById('btnChessResignConfirmYes').addEventListener('click', async ()=>{
  document.getElementById('chessResignConfirmOverlay').classList.remove('show');
  if(window.chessBotMode){
    if(window.chessSetResigned) window.chessSetResigned('Bilgisayar');
    return;
  }
  if(!currentChessDuelId){ showToast('Aktif bir oyun bulunamadı'); return; }
  try{
    const doc = await db.collection('chess_duels').doc(currentChessDuelId).get();
    const d = doc.data();
    const winnerUid = d.player1Uid === currentUser.uid ? d.player2Uid : d.player1Uid;
    await db.collection('chess_duels').doc(currentChessDuelId).update({ status:'finished', winnerUid, resignedBy: currentUser.uid });
  }catch(e){ console.error('Teslim olma hatası', e); showToast('İşlem başarısız'); }
});

// ================= SATRANÇ: RASTGELE RAKİP EŞLEŞTİRME =================
// Mantık: önce chess_queue'da bekleyen biri var mı diye bakılır. Varsa transaction ile
// o kişi "kapılır" ve doğrudan aktif bir chess_duels açılır (kapılan kişi beyaz, biz siyah).
// Yoksa kendimiz kuyruğa eklenip 20 saniye beklenir; bu sırada biri bizi kaparsa
// onSnapshot ile yakalanır. 20 saniye dolarsa kuyruktan çıkılır ve bilgisayara karşı başlanır.
let chessQueueUnsub = null;
let chessMatchmakingTimer = null;
let chessCountdownInterval = null;
let chessMatchHandled = false;

document.getElementById('btnChessRandomOpponent').addEventListener('click', ()=>{
  startChessMatchmaking();
});
document.getElementById('btnChessVsBot').addEventListener('click', ()=>{
  startChessVsBotGame();
});
document.getElementById('btnChessMatchmakingCancel').addEventListener('click', ()=>{
  cancelChessMatchmaking();
  switchScreen('chess-pick-friend');
});
document.getElementById('btnChessMatchmakingBack').addEventListener('click', ()=>{
  cancelChessMatchmaking();
  switchScreen('chess-pick-friend');
});

async function startChessMatchmaking(){
  chessMatchHandled = false;
  switchScreen('chess-matchmaking');
  beginChessCountdownDisplay();

  // 1) Kuyrukta bekleyen birini kapmayı dene
  try{
    const waitingSnap = await db.collection('chess_queue').where('status','==','waiting').limit(6).get();
    const candidates = waitingSnap.docs.map(d=>d.id).filter(uid => uid !== currentUser.uid);
    for(const candidateUid of candidates){
      if(chessMatchHandled) return;
      const claimedDuelId = await tryClaimChessOpponent(candidateUid);
      if(claimedDuelId){
        chessMatchHandled = true;
        clearChessMatchmakingTimer();
        window.chessMyColor = 'b'; // kuyrukta bekleyen taraf beyazdı, biz sonradan katılan siyahız
        await startChessGameScreen(claimedDuelId);
        return;
      }
    }
  }catch(e){ console.error('Rakip aranırken hata', e); }

  if(chessMatchHandled) return;

  // 2) Kimse bulunamadı, kendimizi kuyruğa ekleyip bekleyelim
  try{
    await db.collection('chess_queue').doc(currentUser.uid).set({
      uid: currentUser.uid, status:'waiting', duelId: null, joinedAt: new Date().toISOString()
    });
  }catch(e){
    console.error('Kuyruğa eklenemedi', e);
    showToast('Eşleştirme başlatılamadı');
    switchScreen('chess-pick-friend');
    return;
  }

  if(chessQueueUnsub){ chessQueueUnsub(); chessQueueUnsub = null; }
  chessQueueUnsub = db.collection('chess_queue').doc(currentUser.uid).onSnapshot(async doc=>{
    if(chessMatchHandled) return;
    const d = doc.data();
    if(d && d.status === 'matched' && d.duelId){
      chessMatchHandled = true;
      clearChessMatchmakingTimer();
      if(chessQueueUnsub){ chessQueueUnsub(); chessQueueUnsub = null; }
      window.chessMyColor = 'w'; // kuyrukta bekleyen taraf her zaman beyaz olur
      try{ await db.collection('chess_queue').doc(currentUser.uid).delete(); }catch(e){}
      await startChessGameScreen(d.duelId);
    }
  });

  chessMatchmakingTimer = setTimeout(async ()=>{
    if(chessMatchHandled) return;
    chessMatchHandled = true;
    if(chessQueueUnsub){ chessQueueUnsub(); chessQueueUnsub = null; }
    try{ await db.collection('chess_queue').doc(currentUser.uid).delete(); }catch(e){}
    showToast('Rakip bulunamadı, bilgisayara karşı oynuyorsun 🤖');
    startChessVsBotGame();
  }, 20000);
}

async function tryClaimChessOpponent(candidateUid){
  try{
    const duelRef = db.collection('chess_duels').doc();
    return await db.runTransaction(async tx=>{
      const qRef = db.collection('chess_queue').doc(candidateUid);
      const qDoc = await tx.get(qRef);
      if(!qDoc.exists || qDoc.data().status !== 'waiting') return null;
      tx.set(duelRef, {
        player1Uid: candidateUid, player2Uid: currentUser.uid,
        fen: CHESS_INITIAL_FEN, status:'active', matchType:'random',
        capturedWhite: [], capturedBlack: [],
        lastMove: null, winnerUid: null, resignedBy: null,
        createdAt: new Date().toISOString()
      });
      tx.update(qRef, { status:'matched', duelId: duelRef.id });
      return duelRef.id;
    });
  }catch(e){
    console.error('Rakip kapılamadı (başka biri kapmış olabilir)', e);
    return null;
  }
}

function beginChessCountdownDisplay(){
  let remaining = 20;
  updateChessMatchmakingCountdownText(remaining);
  chessCountdownInterval = setInterval(()=>{
    remaining--;
    updateChessMatchmakingCountdownText(Math.max(remaining,0));
    if(remaining <= 0){ clearInterval(chessCountdownInterval); chessCountdownInterval = null; }
  }, 1000);
}
function updateChessMatchmakingCountdownText(seconds){
  const el = document.getElementById('chessMatchmakingCountdown');
  if(el) el.textContent = seconds + ' saniye';
}
function clearChessMatchmakingTimer(){
  if(chessMatchmakingTimer){ clearTimeout(chessMatchmakingTimer); chessMatchmakingTimer = null; }
  if(chessCountdownInterval){ clearInterval(chessCountdownInterval); chessCountdownInterval = null; }
}
function cancelChessMatchmaking(){
  chessMatchHandled = true;
  clearChessMatchmakingTimer();
  if(chessQueueUnsub){ chessQueueUnsub(); chessQueueUnsub = null; }
  if(currentUser) db.collection('chess_queue').doc(currentUser.uid).delete().catch(()=>{});
}

// ================= SATRANÇ: BİLGİSAYARA KARŞI (yerel, ağ gerektirmeyen bot) =================
async function startChessVsBotGame(){
  window.chessBotMode = true;
  window.chessMyColor = 'w';
  currentChessDuelId = null;
  await startChessGameScreen(null);
}

// Basit negamax + alpha-beta budamalı satranç botu. Sadece chess.js'in kendi hamle
// üretimini kullanır, harici bir motor/CDN gerektirmez. Derinlik 2 = hızlı ve makul seviye.
const CHESS_BOT_PIECE_VALUE = { p:100, n:320, b:330, r:500, q:900, k:0 };
function chessBotEvaluate(pos){
  // Pozitif skor: o an sırası gelen taraf için iyi (klasik negamax kuralı)
  if(pos.in_checkmate()) return -100000;
  if(pos.in_draw() || pos.in_stalemate() || (pos.in_threefold_repetition && pos.in_threefold_repetition())) return 0;
  const board = pos.board();
  let score = 0;
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = board[r][c];
      if(!sq) continue;
      const val = CHESS_BOT_PIECE_VALUE[sq.type] || 0;
      score += (sq.color === pos.turn() ? val : -val);
    }
  }
  return score;
}
function chessBotNegamax(pos, depth, alpha, beta){
  if(depth === 0 || pos.game_over()) return chessBotEvaluate(pos);
  const moves = pos.moves();
  if(moves.length === 0) return chessBotEvaluate(pos);
  let best = -Infinity;
  for(let i=0;i<moves.length;i++){
    pos.move(moves[i]);
    const score = -chessBotNegamax(pos, depth-1, -beta, -alpha);
    pos.undo();
    if(score > best) best = score;
    if(best > alpha) alpha = best;
    if(alpha >= beta) break; // alpha-beta budama
  }
  return best;
}
function computeChessBotMove(fen, depth){
  const sim = new Chess(fen);
  const moves = sim.moves({ verbose:true });
  if(moves.length === 0) return null;
  let bestMoves = [];
  let bestScore = -Infinity;
  for(let i=0;i<moves.length;i++){
    sim.move(moves[i]);
    const score = -chessBotNegamax(sim, depth-1, -Infinity, Infinity);
    sim.undo();
    if(score > bestScore){ bestScore = score; bestMoves = [moves[i]]; }
    else if(score === bestScore){ bestMoves.push(moves[i]); }
  }
  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return { from: chosen.from, to: chosen.to };
}
function playChessBotMove(fen){
  if(!window.chessBotMode) return;
  if(window.chessGetGameOverInfo){
    const info = window.chessGetGameOverInfo();
    if(info.over) return;
  }
  const move = computeChessBotMove(fen, 2);
  if(!move) return;
  if(window.chessApplyRemoteMove) window.chessApplyRemoteMove(move.from, move.to);
}

// ================= SATRANÇ İÇİ SESLİ SOHBET (arama ekranı YOK, doğrudan kanal) =================
// Bu, mesajlaşmadaki "calls" sistemiyle aynı WebRTC mantığını kullanır ama tamamen ayrı ve
// dahadır: mikrofona basınca zil çalmaz, kabul/red ekranı açılmaz — sadece sinyalleşme verisi
// doğrudan chess_duels dokümanının üstüne (aynı belge, ekstra Firestore kuralı gerekmeden)
// yazılır ve iki taraf da mikrofonunu açtığında ses akışı sessizce kurulur.
let chessVoiceActive = false;
let chessVoicePc = null;
let chessVoiceStream = null;
let chessVoiceUnsub = null;
let chessVoiceRole = null; // 'offerer' | 'answerer' — kim teklif eder, uid karşılaştırmasıyla deterministik belirlenir
let chessVoiceAppliedRemoteCandidates = 0;
let chessVoiceSentCandidates = 0;

function chessVoiceMyCandidateField(){ return chessVoiceRole === 'offerer' ? 'voiceCallerCandidates' : 'voiceCalleeCandidates'; }
function chessVoiceRemoteCandidateField(){ return chessVoiceRole === 'offerer' ? 'voiceCalleeCandidates' : 'voiceCallerCandidates'; }

async function toggleChessVoice(){
  if(chessVoiceActive){ stopChessVoice(); return; }
  if(!window.chessOpponentUid){ showToast('Rakip henüz belli değil'); return; }
  if(!currentChessDuelId){ showToast('Bu modda sesli sohbet yok'); return; }

  setChessVoiceStatus('Mikrofon izni isteniyor…');
  let stream;
  try{
    stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:false });
  }catch(e){
    showToast('Mikrofon izni verilmedi');
    setChessVoiceStatus('');
    return;
  }

  chessVoiceStream = stream;
  chessVoiceActive = true;
  chessVoiceAppliedRemoteCandidates = 0;
  chessVoiceSentCandidates = 0;
  // Kim teklif eden (offerer) olacağı, iki tarafın da aynı sonuca varması için uid karşılaştırmasıyla belirleniyor.
  chessVoiceRole = (currentUser.uid < window.chessOpponentUid) ? 'offerer' : 'answerer';
  updateChessVoiceButtonUI();
  setChessVoiceStatus(chessVoiceRole === 'offerer' ? 'Teklif hazırlanıyor…' : 'Rakip bekleniyor…');

  const duelRef = db.collection('chess_duels').doc(currentChessDuelId);

  chessVoicePc = new RTCPeerConnection({ iceServers: CALL_ICE_SERVERS });
  chessVoiceStream.getTracks().forEach(t => chessVoicePc.addTrack(t, chessVoiceStream));
  chessVoicePc.ontrack = (event) => {
    const audioEl = document.getElementById('chessRemoteAudio');
    if(audioEl) audioEl.srcObject = event.streams[0];
    setChessVoiceStatus('Bağlandı ✅');
  };
  chessVoicePc.onicecandidate = (event) => {
    if(event.candidate){
      chessVoiceSentCandidates++;
      duelRef.update({ [chessVoiceMyCandidateField()]: firebase.firestore.FieldValue.arrayUnion(event.candidate.toJSON()) }).catch(e=>console.error('candidate yazılamadı', e));
      setChessVoiceStatus('Bağlantı kuruluyor… (' + chessVoiceSentCandidates + ' adres gönderildi)');
    }
  };
  chessVoicePc.oniceconnectionstatechange = () => {
    if(!chessVoicePc) return;
    console.log('chess voice ICE state:', chessVoicePc.iceConnectionState);
    if(chessVoicePc.iceConnectionState === 'connected' || chessVoicePc.iceConnectionState === 'completed'){
      setChessVoiceStatus('Bağlandı ✅');
    } else if(chessVoicePc.iceConnectionState === 'failed'){
      setChessVoiceStatus('Bağlantı kurulamadı ❌');
    } else if(chessVoicePc.iceConnectionState === 'disconnected'){
      setChessVoiceStatus('Bağlantı koptu');
    }
  };

  // Önce olası eski (bir önceki oturumdan kalma) sinyalleri temizliyoruz — bunu description
  // yazma işleminden AYRI ve ÖNCE yapıyoruz ki, biraz sonra hızlıca gelmeye başlayacak ICE
  // candidate'ları yanlışlıkla silinmesin (aynı yazma isteğinde hem description hem "boş dizi"
  // göndermek, candidate'larla yarış durumuna girip onları silebiliyordu — asıl hataydı bu).
  if(chessVoiceRole === 'offerer'){
    try{
      await duelRef.set({ voiceOffer: null, voiceAnswer: null, voiceCallerCandidates: [], voiceCalleeCandidates: [] }, { merge:true });
      const offer = await chessVoicePc.createOffer();
      await chessVoicePc.setLocalDescription(offer);
      await duelRef.set({ voiceOffer: { type: offer.type, sdp: offer.sdp } }, { merge:true });
      setChessVoiceStatus('Teklif gönderildi, rakip bekleniyor…');
    }catch(e){ console.error('Sesli sohbet teklifi oluşturulamadı', e); showToast('Sesli sohbet başlatılamadı'); setChessVoiceStatus('Hata: teklif oluşturulamadı'); stopChessVoice(); return; }
  }

  if(chessVoiceUnsub) chessVoiceUnsub();
  chessVoiceUnsub = duelRef.onSnapshot(async (docSnap)=>{
    if(!chessVoiceActive || !chessVoicePc) return;
    const d = docSnap.data();
    if(!d) return;

    try{
      if(chessVoiceRole === 'answerer' && d.voiceOffer && !chessVoicePc.currentRemoteDescription){
        setChessVoiceStatus('Teklif alındı, cevap hazırlanıyor…');
        await chessVoicePc.setRemoteDescription(new RTCSessionDescription(d.voiceOffer));
        const answer = await chessVoicePc.createAnswer();
        await chessVoicePc.setLocalDescription(answer);
        await duelRef.set({ voiceAnswer: { type: answer.type, sdp: answer.sdp } }, { merge:true });
        setChessVoiceStatus('Cevap gönderildi…');
      }
      if(chessVoiceRole === 'offerer' && d.voiceAnswer && chessVoicePc.currentLocalDescription && !chessVoicePc.currentRemoteDescription){
        setChessVoiceStatus('Cevap alındı…');
        await chessVoicePc.setRemoteDescription(new RTCSessionDescription(d.voiceAnswer));
      }
    }catch(e){ console.error('Sesli sohbet SDP hatası', e); setChessVoiceStatus('Hata: SDP işlenemedi'); }

    const remoteField = chessVoiceRemoteCandidateField();
    const remoteCandidates = d[remoteField] || [];
    if(remoteCandidates.length > chessVoiceAppliedRemoteCandidates){
      const newOnes = remoteCandidates.slice(chessVoiceAppliedRemoteCandidates);
      chessVoiceAppliedRemoteCandidates = remoteCandidates.length;
      newOnes.forEach(c => { chessVoicePc.addIceCandidate(new RTCIceCandidate(c)).catch(e=>console.error('candidate eklenemedi', e)); });
    }
  }, (err)=>{ console.error('Sesli sohbet dinleyici hatası', err); setChessVoiceStatus('Hata: dinleyici çöktü'); });
}

function stopChessVoice(){
  if(!chessVoiceActive && !chessVoicePc && !chessVoiceStream) return;
  chessVoiceActive = false;
  if(chessVoiceUnsub){ chessVoiceUnsub(); chessVoiceUnsub = null; }
  if(chessVoiceStream){ chessVoiceStream.getTracks().forEach(t=>t.stop()); chessVoiceStream = null; }
  if(chessVoicePc){ try{ chessVoicePc.close(); }catch(e){} chessVoicePc = null; }
  const audioEl = document.getElementById('chessRemoteAudio');
  if(audioEl) audioEl.srcObject = null;
  chessVoiceRole = null;
  chessVoiceAppliedRemoteCandidates = 0;
  chessVoiceSentCandidates = 0;
  if(currentChessDuelId){
    db.collection('chess_duels').doc(currentChessDuelId).set({
      voiceOffer: null, voiceAnswer: null, voiceCallerCandidates: [], voiceCalleeCandidates: []
    }, { merge:true }).catch(()=>{});
  }
  updateChessVoiceButtonUI();
  setChessVoiceStatus('');
}

function updateChessVoiceButtonUI(){
  const btn = document.getElementById('btnChessVoiceCall');
  if(!btn) return;
  btn.textContent = chessVoiceActive ? '🔴' : '🎤';
}

function setChessVoiceStatus(text){
  const el = document.getElementById('chessVoiceStatus');
  if(!el) return;
  if(!text){ el.style.display = 'none'; el.textContent = ''; return; }
  el.style.display = 'block';
  el.textContent = text;
}
