/**
 * spatial-3d.js - Real-Time 3D Holographic WebGL Agent Constellation ("Emerald Singularity")
 * 
 * Powered by Three.js (WebGL).
 * Features:
 * - 1,500 bioluminescent depth particles with mouse parallax
 * - 3 Floating 3D Crystalline Agent Nodes (Icosahedron, Octahedron, TorusKnot)
 * - 3D Energy curves with animated light packet pulses
 * - Global trigger: window.trigger3DNegotiationPulse(state)
 */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

class SpatialScene {
  constructor() {
    this.canvas = document.getElementById("spatial-canvas");
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Entities
    this.particles = null;
    this.hubNode = null;
    this.hubCore = null;
    this.pineNode = null;
    this.fjordNode = null;

    // Beams & pulses
    this.curves = [];
    this.beamMeshes = [];
    this.pulsePackets = [];

    // Interactive state
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.pulseEnergy = 1.0;
    this.isNegotiating = false;

    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030906, 0.035);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 16);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030906, 1);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x0d281e, 2.5);
    this.scene.add(ambientLight);

    const pointEmerald = new THREE.PointLight(0x10b981, 4.0, 30);
    pointEmerald.position.set(0, 2, 8);
    this.scene.add(pointEmerald);

    const pointCyan = new THREE.PointLight(0x06b6d4, 3.0, 30);
    pointCyan.position.set(-6, -2, 6);
    this.scene.add(pointCyan);

    const pointGold = new THREE.PointLight(0xf59e0b, 2.5, 30);
    pointGold.position.set(6, -2, 6);
    this.scene.add(pointGold);

    // 4. Bioluminescent Particle Field (1,500 particles)
    this.createBioluminescentField();

    // 5. 3 Floating 3D Crystalline Agent Nodes
    this.createAgentNodes();

    // 6. Connect Nodes with Glowing Energy Beams
    this.createEnergyBeams();

    // 7. Event Listeners
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));

    // Expose global trigger
    window.trigger3DNegotiationPulse = (state = "active") => this.triggerPulse(state);

    // 8. Start loop
    this.animate();
  }

  createBioluminescentField() {
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const palette = [
      new THREE.Color(0x10b981), // Emerald
      new THREE.Color(0x34d399), // Mint
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0xf59e0b)  // Champagne Gold
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36 - 6;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = Math.random() * 2.5 + 1.0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Soft glowing point canvas texture
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(52,211,153,0.8)");
    grad.addColorStop(0.7, "rgba(16,185,129,0.2)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createAgentNodes() {
    // NODE 1: Center Hub (VerdantNANDA Concierge)
    // Outer Icosahedron Wireframe + Inner Pulsing Core
    const hubGroup = new THREE.Group();
    hubGroup.position.set(0, 1.2, 0);

    const icoGeo = new THREE.IcosahedronGeometry(2.0, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      wireframe: true,
      emissive: 0x065f46,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });
    this.hubNode = new THREE.Mesh(icoGeo, icoMat);
    hubGroup.add(this.hubNode);

    const coreGeo = new THREE.OctahedronGeometry(0.8, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 2.0,
      roughness: 0.2
    });
    this.hubCore = new THREE.Mesh(coreGeo, coreMat);
    hubGroup.add(this.hubCore);

    this.scene.add(hubGroup);
    this.hubGroup = hubGroup;

    // NODE 2: Left Peer (PineRidge Eco-Stays)
    // Translucent Octahedron Glass Mesh
    const pineGroup = new THREE.Group();
    pineGroup.position.set(-6.2, 0.4, -2.5);

    const pineGeo = new THREE.OctahedronGeometry(1.4, 0);
    const pineMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      emissive: 0x047857,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.2,
      wireframe: false
    });
    this.pineNode = new THREE.Mesh(pineGeo, pineMat);
    pineGroup.add(this.pineNode);

    // Wireframe halo
    const pineHalo = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.35 })
    );
    pineGroup.add(pineHalo);

    this.scene.add(pineGroup);
    this.pineGroup = pineGroup;

    // NODE 3: Right Peer (EmeraldFjord Expeditions)
    // Translucent TorusKnot Glass Mesh
    const fjordGroup = new THREE.Group();
    fjordGroup.position.set(6.2, 0.4, -2.5);

    const fjordGeo = new THREE.TorusKnotGeometry(0.95, 0.28, 64, 16);
    const fjordMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0e7490,
      emissiveIntensity: 0.7,
      roughness: 0.15,
      transmission: 0.5,
      thickness: 1.0
    });
    this.fjordNode = new THREE.Mesh(fjordGeo, fjordMat);
    fjordGroup.add(this.fjordNode);

    // Wireframe halo
    const fjordHalo = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.1, 0.12, 48, 12),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.35 })
    );
    fjordGroup.add(fjordHalo);

    this.scene.add(fjordGroup);
    this.fjordGroup = fjordGroup;
  }

  createEnergyBeams() {
    // Curve 1: Hub to PineRidge (Left)
    const curve1 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(-3.1, 2.8, -1.0),
      new THREE.Vector3(-6.2, 0.4, -2.5)
    );
    this.curves.push(curve1);

    // Curve 2: Hub to EmeraldFjord (Right)
    const curve2 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(3.1, 2.8, -1.0),
      new THREE.Vector3(6.2, 0.4, -2.5)
    );
    this.curves.push(curve2);

    this.curves.forEach((curve, index) => {
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: index === 0 ? 0x10b981 : 0x06b6d4,
        transparent: true,
        opacity: 0.35,
        linewidth: 2
      });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this.beamMeshes.push(line);
    });

    // Create 8 reusable glowing light packet spheres
    for (let i = 0; i < 8; i++) {
      const packetGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xa7f3d0 : 0x67e8f9,
        transparent: true,
        opacity: 0.95
      });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      packet.visible = false;
      this.scene.add(packet);
      this.pulsePackets.push({
        mesh: packet,
        curveIndex: i % 2,
        progress: (i / 8),
        speed: 0.35 + Math.random() * 0.25
      });
    }
  }

  triggerPulse(state = "active") {
    this.isNegotiating = true;
    this.pulseEnergy = 3.2;

    // Show packets and boost speed
    this.pulsePackets.forEach(p => {
      p.mesh.visible = true;
      p.speed = 1.2 + Math.random() * 0.8;
    });

    // Reset after burst
    setTimeout(() => {
      this.pulseEnergy = 1.0;
      this.isNegotiating = false;
    }, 4500);
  }

  onMouseMove(e) {
    this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Smooth camera parallax
    this.targetCameraX = this.mouseX * 1.8;
    this.targetCameraY = -this.mouseY * 1.2;
    this.camera.position.x += (this.targetCameraX - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.targetCameraY - this.camera.position.y) * 0.05;
    this.camera.lookAt(0, 0.6, 0);

    // Rotate particle cloud gently
    if (this.particles) {
      this.particles.rotation.y = time * 0.02;
      this.particles.rotation.x = Math.sin(time * 0.015) * 0.05;
    }

    // Rotate Agent Nodes (speed depends on pulseEnergy)
    const spinRate = this.pulseEnergy;
    if (this.hubNode) {
      this.hubNode.rotation.y += 0.008 * spinRate;
      this.hubNode.rotation.x += 0.005 * spinRate;
    }
    if (this.hubCore) {
      this.hubCore.rotation.y -= 0.015 * spinRate;
      this.hubCore.rotation.z += 0.012 * spinRate;
      const s = 1.0 + Math.sin(time * 4) * 0.08 * spinRate;
      this.hubCore.scale.set(s, s, s);
    }
    if (this.pineNode) {
      this.pineNode.rotation.y += 0.012 * spinRate;
      this.pineNode.rotation.z += 0.007 * spinRate;
      this.pineGroup.position.y = 0.4 + Math.sin(time * 1.5) * 0.2;
    }
    if (this.fjordNode) {
      this.fjordNode.rotation.x += 0.014 * spinRate;
      this.fjordNode.rotation.y += 0.01 * spinRate;
      this.fjordGroup.position.y = 0.4 + Math.cos(time * 1.5) * 0.2;
    }

    // Animate energy packets along 3D curves
    this.pulsePackets.forEach(p => {
      p.progress += delta * p.speed;
      if (p.progress > 1) {
        p.progress = 0;
        if (!this.isNegotiating && Math.random() > 0.4) {
          p.mesh.visible = false;
        } else {
          p.mesh.visible = true;
        }
      }

      if (p.mesh.visible) {
        const curve = this.curves[p.curveIndex];
        const point = curve.getPoint(p.progress);
        p.mesh.position.copy(point);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize on DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new SpatialScene());
  } else {
    new SpatialScene();
  }
}
