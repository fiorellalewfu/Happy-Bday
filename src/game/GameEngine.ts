import * as THREE from 'three';
import { LetterChapter, EasterEgg } from '../types';
import { playJumpSound, playStarSound, playEasterEggSound } from '../audio/soundEffects';
import { setSoundCloudVolume } from '../audio/soundcloudManager';

export interface GameEngineCallbacks {
  onStarCollect: (starIndex: number, chapter: LetterChapter) => void;
  onEasterEggFound: (egg: EasterEgg) => void;
  onReachGoal: () => void;
  onStarCountUpdate: (count: number) => void;
}

export class RetroPlatformerEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isPaused = false;
  private callbacks: GameEngineCallbacks;

  // Player state
  private playerGroup: THREE.Group;
  private playerShadow: THREE.Mesh;
  private playerPos = { x: 0, y: 3, z: 0 };
  private playerVel = { x: 0, y: 0 };
  private isGrounded = false;
  private facing = 1; // 1 = right, -1 = left
  private isCelebrating = false;
  private celebrationTimer = 0;
  private runCycle = 0;

  // Meshes for animation
  private playerLeftLeg!: THREE.Mesh;
  private playerRightLeg!: THREE.Mesh;
  private playerLeftArm!: THREE.Mesh;
  private playerRightArm!: THREE.Mesh;
  private playerHead!: THREE.Group;
  private headphoneCups: THREE.Mesh[] = [];

  // Platforms
  private platforms: { x: number; y: number; width: number; height: number; mesh: THREE.Object3D }[] = [];

  // Stars
  private stars: { index: number; mesh: THREE.Group; collected: boolean; x: number; y: number; rings: THREE.Mesh[]; chapter: LetterChapter }[] = [];
  private collectedStarsCount = 0;

  // Easter Eggs
  private easterEggs: { data: EasterEgg; mesh: THREE.Group; found: boolean }[] = [];

  // Celestial Lights (Parents - Mom & Dad)
  private parentLightA!: THREE.PointLight;
  private parentLightB!: THREE.PointLight;
  private parentOrbA!: THREE.Mesh;
  private parentOrbB!: THREE.Mesh;

  // Laser beams & concert spotlights
  private lasers: { mesh: THREE.Mesh; baseRotZ: number; speed: number; phase: number }[] = [];
  private speakerCones: THREE.Mesh[] = [];

  // Environment elements
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private duskOrbs: THREE.Mesh[] = [];

  // Controls
  private input = { left: false, right: false, jump: false };
  private lastJumpPressed = false;
  private respawnX = 0;
  private respawnY = 3;

  constructor(container: HTMLElement, chapters: LetterChapter[], easterEggsList: EasterEgg[], callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Scene with deep twilight & electronic sunset festival atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16); // Deep club twilight indigo
    this.scene.fog = new THREE.Fog(0x090d16, 28, 105);

    // Camera: classic 2.5D side view with depth
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 5.2, 18.5);
    this.camera.lookAt(0, 3.5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Setup Lighting & Lasers
    this.setupLighting();
    this.setupLaserBeams();

    // World & Level
    this.playerGroup = new THREE.Group();
    this.playerShadow = this.createShadowMesh();
    this.buildDJPlayer();
    this.buildLevel(chapters, easterEggsList);
    this.buildCelestialParents();
    this.buildBackgroundScenery();

    // Listeners
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Start loop
    this.animate();
  }

  private setupLighting() {
    // Warm twilight ambient
    this.ambientLight = new THREE.AmbientLight(0x312e81, 0.9);
    this.scene.add(this.ambientLight);

    // Golden hour stage / sunset directional light
    this.dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    this.dirLight.position.set(25, 45, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 160;
    this.dirLight.shadow.camera.left = -32;
    this.dirLight.shadow.camera.right = 32;
    this.dirLight.shadow.camera.top = 32;
    this.dirLight.shadow.camera.bottom = -32;
    this.scene.add(this.dirLight);

    // Accent colored rim light (festival stage back-glow)
    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.7);
    rimLight.position.set(-20, 20, -15);
    this.scene.add(rimLight);
  }

  private setupLaserBeams() {
    // Elegant festival laser beams shooting up into the night sky
    const colors = [0x06b6d4, 0xd946ef, 0xfacc15, 0x3b82f6, 0x10b981];
    const laserXPositions = [12, 35, 68, 105, 142, 158];

    laserXPositions.forEach((lx, idx) => {
      const laserGeo = new THREE.CylinderGeometry(0.06, 0.28, 55, 8);
      const laserMat = new THREE.MeshBasicMaterial({
        color: colors[idx % colors.length],
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const laserMesh = new THREE.Mesh(laserGeo, laserMat);
      laserMesh.position.set(lx, 26, -10 - (idx % 3) * 4);
      laserMesh.rotation.z = (Math.PI / 16) * (idx % 2 === 0 ? 1 : -1);
      this.scene.add(laserMesh);

      this.lasers.push({
        mesh: laserMesh,
        baseRotZ: laserMesh.rotation.z,
        speed: 0.8 + (idx % 3) * 0.4,
        phase: idx * 1.5
      });
    });
  }

  private createShadowMesh(): THREE.Mesh {
    const shadowGeo = new THREE.CircleGeometry(0.7, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.05;
    this.scene.add(shadow);
    return shadow;
  }

  private buildDJPlayer() {
    // Jonathan as a stylish DJ:
    // Sleek obsidian bomber jacket / hoodie, modern streetwear, pro DJ headphones with glowing earcups, fresh runners
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Obsidian black
      roughness: 0.4,
      metalness: 0.2
    });
    const teeMat = new THREE.MeshLambertMaterial({ color: 0x27272a }); // Charcoal inner tee
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xeab308,
      emissiveIntensity: 0.35
    });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0a96d }); // Natural stylized skin tone
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 }); // Slim streetwear trousers
    const sneakerSoleMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc }); // Crisp white runner sole
    const sneakerUpperMat = new THREE.MeshLambertMaterial({ color: 0x09090b }); // Dark runner upper
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x18181b }); // Modern dark hair / stylish cap

    // Torso (Stylish Bomber Jacket)
    const torsoGeo = new THREE.BoxGeometry(0.88, 1.05, 0.58);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.playerGroup.add(torso);

    // Jacket Gold Zipper / Strip Accent
    const zipGeo = new THREE.BoxGeometry(0.06, 1.02, 0.6);
    const zip = new THREE.Mesh(zipGeo, goldAccentMat);
    zip.position.set(0, 1.05, 0.02);
    this.playerGroup.add(zip);

    // Inner Tee Collar
    const collarGeo = new THREE.BoxGeometry(0.35, 0.15, 0.59);
    const collar = new THREE.Mesh(collarGeo, teeMat);
    collar.position.set(0, 1.5, 0);
    this.playerGroup.add(collar);

    // Head Group
    this.playerHead = new THREE.Group();
    this.playerHead.position.set(0, 1.85, 0);

    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.playerHead.add(head);

    // Modern Haircut / Cap
    const hairGeo = new THREE.BoxGeometry(0.86, 0.35, 0.86);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.32;
    this.playerHead.add(hair);

    const hairBackGeo = new THREE.BoxGeometry(0.84, 0.5, 0.25);
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    hairBack.position.set(0, 0.05, -0.35);
    this.playerHead.add(hairBack);

    // Sunglasses / Stylized Eyes (Cool aviator/wayfarer visor glasses)
    const shadesGeo = new THREE.BoxGeometry(0.72, 0.2, 0.12);
    const shadesMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.9,
      roughness: 0.1
    });
    const shades = new THREE.Mesh(shadesGeo, shadesMat);
    shades.position.set(0, 0.08, 0.42);
    this.playerHead.add(shades);

    // DJ HEADPHONES (Over ears / resting on head)
    const bandGeo = new THREE.TorusGeometry(0.48, 0.06, 6, 16, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.45, 0);
    this.playerHead.add(band);

    // Glowing DJ Earcups (LED amber house rings)
    const cupGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12);
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });

    const cupL = new THREE.Mesh(cupGeo, cupMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.46, 0.1, 0);

    const cupR = new THREE.Mesh(cupGeo, cupMat);
    cupR.rotation.z = Math.PI / 2;
    cupR.position.set(0.46, 0.1, 0);

    this.headphoneCups = [cupL, cupR];
    this.playerHead.add(cupL, cupR);
    this.playerGroup.add(this.playerHead);

    // Limbs - Legs (Dark Streetwear)
    const legGeo = new THREE.BoxGeometry(0.32, 0.65, 0.36);
    this.playerLeftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.playerLeftLeg.position.set(-0.24, 0.4, 0);
    this.playerLeftLeg.castShadow = true;

    this.playerRightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.playerRightLeg.position.set(0.24, 0.4, 0);
    this.playerRightLeg.castShadow = true;

    // Fresh White Sole Sneakers
    const sneakerGeo = new THREE.BoxGeometry(0.35, 0.22, 0.54);
    const sneakerL = new THREE.Mesh(sneakerGeo, sneakerUpperMat);
    sneakerL.position.set(0, -0.26, 0.08);

    const soleGeo = new THREE.BoxGeometry(0.37, 0.08, 0.56);
    const soleL = new THREE.Mesh(soleGeo, sneakerSoleMat);
    soleL.position.set(0, -0.34, 0.08);
    this.playerLeftLeg.add(sneakerL, soleL);

    const sneakerR = new THREE.Mesh(sneakerGeo, sneakerUpperMat);
    sneakerR.position.set(0, -0.26, 0.08);
    const soleR = new THREE.Mesh(soleGeo, sneakerSoleMat);
    soleR.position.set(0, -0.34, 0.08);
    this.playerRightLeg.add(sneakerR, soleR);

    this.playerGroup.add(this.playerLeftLeg, this.playerRightLeg);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.28, 0.7, 0.28);
    this.playerLeftArm = new THREE.Mesh(armGeo, jacketMat);
    this.playerLeftArm.position.set(-0.58, 1.05, 0);

    this.playerRightArm = new THREE.Mesh(armGeo, jacketMat);
    this.playerRightArm.position.set(0.58, 1.05, 0);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.24, 0.22, 0.24);
    const handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(0, -0.4, 0);
    this.playerLeftArm.add(handL);

    const handR = new THREE.Mesh(handGeo, skinMat);
    handR.position.set(0, -0.4, 0);
    this.playerRightArm.add(handR);

    this.playerGroup.add(this.playerLeftArm, this.playerRightArm);

    this.playerGroup.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    this.scene.add(this.playerGroup);
  }

  private buildLevel(chapters: LetterChapter[], easterEggsList: EasterEgg[]) {
    // Sophisticated Club / Festival Materials:
    // Polished teak club deck, obsidian slate, glowing LED track trim, subwoofer speaker blocks
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x3b2a1a, // Rich sunset teak wood
      roughness: 0.5,
      metalness: 0.1
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Matte dark slate/obsidian
      roughness: 0.7,
      metalness: 0.2
    });

    const neonAmberMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
      roughness: 0.2
    });

    const neonVioletMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.65,
      roughness: 0.2
    });

    const speakerGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.8,
      roughness: 0.3
    });

    const speakerConeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      roughness: 0.5
    });

    const addPlatform = (
      x: number,
      y: number,
      width: number,
      height: number,
      type: 'deck' | 'obsidian' | 'subwoofer' | 'floating' = 'obsidian',
      neonColor: 'gold' | 'violet' = 'gold'
    ) => {
      const group = new THREE.Group();

      const baseMat = type === 'deck' ? deckMat : obsidianMat;
      const bodyGeo = new THREE.BoxGeometry(width, height, 4);
      const body = new THREE.Mesh(bodyGeo, baseMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Top Decking / Trim
      const topGeo = new THREE.BoxGeometry(width + 0.15, 0.25, 4.2);
      const top = new THREE.Mesh(topGeo, type === 'deck' ? deckMat : obsidianMat);
      top.position.y = height / 2;
      top.receiveShadow = true;
      group.add(top);

      // Glowing LED edge strip on top perimeter
      const stripGeo = new THREE.BoxGeometry(width + 0.2, 0.08, 0.1);
      const strip = new THREE.Mesh(stripGeo, neonColor === 'gold' ? neonAmberMat : neonVioletMat);
      strip.position.set(0, height / 2 + 0.12, 2.05);
      group.add(strip);

      // Subwoofer speakers embedded into front face
      if (type === 'subwoofer' || (type === 'obsidian' && width >= 8)) {
        const numSpeakers = Math.floor(width / 3.5);
        for (let s = 0; s < numSpeakers; s++) {
          const spX = -width / 2 + 1.8 + s * 3.5;
          const grilleGeo = new THREE.BoxGeometry(1.6, 1.6, 0.15);
          const grille = new THREE.Mesh(grilleGeo, speakerGrilleMat);
          grille.position.set(spX, 0, 2.05);

          const coneGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.2, 16);
          const cone = new THREE.Mesh(coneGeo, speakerConeMat);
          cone.rotation.x = Math.PI / 2;
          cone.position.set(spX, 0, 2.12);

          const capGeo = new THREE.SphereGeometry(0.2, 12, 12);
          const cap = new THREE.Mesh(capGeo, neonAmberMat);
          cap.position.set(spX, 0, 2.18);

          this.speakerCones.push(cone);
          group.add(grille, cone, cap);
        }
      }

      group.position.set(x, y - height / 2, 0);
      this.scene.add(group);

      this.platforms.push({ x, y, width, height, mesh: group });
    };

    // LEVEL GEOGRAPHY - HOUSE FESTIVAL RUN:
    // Section 1: Sunset Rooftop Warm-up (Chapter 1)
    addPlatform(0, 0, 16, 4, 'deck', 'gold');
    addPlatform(14, 2, 10, 4, 'obsidian', 'gold');

    // Star 1 at (15, 4.0)
    this.createStarMesh(1, chapters[0], 15, 4.0);

    // Section 2: DJ Grooves & Stepping Stones (Chapter 2 & Pioneer CDJ Egg)
    addPlatform(24, 2.5, 4.5, 1.5, 'deck', 'violet');
    addPlatform(31, 3.8, 4.5, 1.5, 'subwoofer', 'gold');
    addPlatform(38, 2.2, 5, 2, 'deck', 'violet');
    addPlatform(46, 4.5, 12, 5, 'obsidian', 'gold');

    // Easter Egg 1: Pioneer DJ Booth & Headphones at X = 28
    this.createEasterEggMesh(easterEggsList[0], 28, 4.3);

    // Star 2 at (48, 6.6)
    this.createStarMesh(2, chapters[1], 48, 6.6);

    // Section 3: Training Course & The Siblings' Ridge (Chapter 3 & Gym Egg)
    addPlatform(57, 4.8, 4, 1.5, 'deck', 'gold');
    addPlatform(64, 6.2, 5.5, 1.5, 'subwoofer', 'gold');
    addPlatform(72, 5.0, 4, 1.5, 'deck', 'violet');
    addPlatform(80, 5.8, 14, 6, 'obsidian', 'gold');

    // Easter Egg 2: Matte Hex Gym Dumbbells & Kettlebell at X = 64
    this.createEasterEggMesh(easterEggsList[1], 64, 7.4);

    // Star 3 at (82, 7.8)
    this.createStarMesh(3, chapters[2], 82, 7.8);

    // Section 4: The Lion's Ascent & Celestial Peak (Mom & Dad's Lights)
    addPlatform(92, 6.0, 5, 2, 'subwoofer', 'violet');
    addPlatform(99, 7.5, 6, 2, 'obsidian', 'gold');
    addPlatform(107, 9.2, 4.5, 1.5, 'floating', 'gold');
    addPlatform(115, 10.8, 12, 7, 'deck', 'gold'); // High peak of the parents' lights

    // Easter Egg 3: The Golden Lion Statue at X = 99
    this.createEasterEggMesh(easterEggsList[2], 99, 9.2);

    // Star 4 at (116, 12.8) - High glowing celestial plateau
    this.createStarMesh(4, chapters[3], 116, 12.8);

    // Section 5: The Canadian Maple Way & Mainstage (Chapter 5 & Canada Egg)
    addPlatform(126, 9.6, 5, 2, 'subwoofer', 'violet');
    addPlatform(134, 8.6, 6, 2, 'deck', 'gold');
    addPlatform(144, 8.0, 16, 6, 'obsidian', 'gold'); // Mainstage ground
    addPlatform(158, 9.5, 12, 8, 'subwoofer', 'gold'); // Final DJ Podium

    // Easter Egg 4: Canadian Maple Leaf Neon at X = 134
    this.createEasterEggMesh(easterEggsList[3], 134, 10.2);

    // Star 5 at (146, 10.2)
    this.createStarMesh(5, chapters[4], 146, 10.2);

    // Final JONAMS Festival Mainstage
    this.buildMainstageArch(158, 9.5);

    // Starting LED Signboard
    this.buildLEDSignboard(0, 0);
  }

  private buildLEDSignboard(x: number, y: number) {
    const signGroup = new THREE.Group();

    // Sleek metallic frame
    const frameGeo = new THREE.BoxGeometry(2.4, 1.4, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);

    // Glowing screen panel
    const screenGeo = new THREE.BoxGeometry(2.2, 1.2, 0.22);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);

    // Support legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
    const legL = new THREE.Mesh(legGeo, frameMat);
    legL.position.set(-0.9, -0.9, 0);
    const legR = new THREE.Mesh(legGeo, frameMat);
    legR.position.set(0.9, -0.9, 0);

    signGroup.add(frame, screen, legL, legR);
    signGroup.position.set(x - 2, y + 1.2, 1);
    this.scene.add(signGroup);
  }

  private createStarMesh(index: number, chapter: LetterChapter, x: number, y: number) {
    const starGroup = new THREE.Group();

    // 5-pointed crystalline star 3D shape with beveled edges
    const shape = new THREE.Shape();
    const outerRadius = 0.9;
    const innerRadius = 0.44;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.38,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12
    };

    const starGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    starGeo.center();

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.75,
      metalness: 0.85,
      roughness: 0.18,
      flatShading: true
    });

    const starMesh = new THREE.Mesh(starGeo, starMat);
    starGroup.add(starMesh);

    // Glowing soundwave rings pulsing like speaker ripples
    const rings: THREE.Mesh[] = [];
    for (let r = 0; r < 2; r++) {
      const ringGeo = new THREE.TorusGeometry(1.2 + r * 0.4, 0.04, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? 0xfacc15 : 0xa855f7,
        transparent: true,
        opacity: 0.5 - r * 0.15
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      starGroup.add(ring);
      rings.push(ring);
    }

    // Dynamic point light
    const starLight = new THREE.PointLight(0xfef08a, 1.8, 8);
    starGroup.add(starLight);

    starGroup.position.set(x, y, 0);
    this.scene.add(starGroup);

    this.stars.push({
      index,
      mesh: starGroup,
      collected: false,
      x,
      y,
      rings,
      chapter
    });
  }

  private createEasterEggMesh(data: EasterEgg, x: number, y: number) {
    const group = new THREE.Group();

    if (data.id === 'dj') {
      // Pro Pioneer-Style DJ Booth & Turntable Setup
      const tableGeo = new THREE.BoxGeometry(1.6, 0.7, 1.0);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.y = 0.35;

      // Vinyl Deck
      const platterGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 24);
      const platterMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
      const platter = new THREE.Mesh(platterGeo, platterMat);
      platter.position.set(-0.35, 0.75, 0);

      // Glowing LED ring on jogwheel
      const jogLedGeo = new THREE.TorusGeometry(0.3, 0.03, 6, 24);
      const jogLedMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const jogLed = new THREE.Mesh(jogLedGeo, jogLedMat);
      jogLed.rotation.x = Math.PI / 2;
      jogLed.position.set(-0.35, 0.8, 0);

      // Mixer Section with LED level meters
      const mixerGeo = new THREE.BoxGeometry(0.4, 0.08, 0.65);
      const mixerMat = new THREE.MeshStandardMaterial({ color: 0x27272a });
      const mixer = new THREE.Mesh(mixerGeo, mixerMat);
      mixer.position.set(0.35, 0.75, 0);

      const ledBarGeo = new THREE.BoxGeometry(0.05, 0.02, 0.35);
      const ledBarMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const ledBar = new THREE.Mesh(ledBarGeo, ledBarMat);
      ledBar.position.set(0.35, 0.8, 0);

      // DJ Headphones resting on deck
      const hpGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 16, Math.PI);
      const hpMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.4 });
      const hp = new THREE.Mesh(hpGeo, hpMat);
      hp.position.set(0, 0.95, 0);

      group.add(table, platter, jogLed, mixer, ledBar, hp);
    } else if (data.id === 'gym') {
      // Matte-Black Hex Gym Dumbbells & Competition Kettlebell
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

      // Hex Dumbbell 1
      const barGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8);
      const bar = new THREE.Mesh(barGeo, steelMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 0.2, 0);

      const hexGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 6);
      const hexL = new THREE.Mesh(hexGeo, rubberMat);
      hexL.rotation.z = Math.PI / 2;
      hexL.position.set(-0.4, 0.2, 0);

      const hexR = new THREE.Mesh(hexGeo, rubberMat);
      hexR.rotation.z = Math.PI / 2;
      hexR.position.set(0.4, 0.2, 0);

      // Competition Kettlebell
      const bellGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const bell = new THREE.Mesh(bellGeo, rubberMat);
      bell.position.set(0.85, 0.35, 0.2);

      const handleGeo = new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI);
      const handle = new THREE.Mesh(handleGeo, steelMat);
      handle.position.set(0.85, 0.65, 0.2);

      group.add(bar, hexL, hexR, bell, handle);
    } else if (data.id === 'lion') {
      // Majestic Low-Poly Geometric Golden Lion
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.35,
        metalness: 0.8,
        roughness: 0.2,
        flatShading: true
      });

      const darkManeMat = new THREE.MeshStandardMaterial({
        color: 0x92400e,
        metalness: 0.6,
        roughness: 0.3,
        flatShading: true
      });

      const lionBodyGeo = new THREE.BoxGeometry(0.85, 0.65, 0.65);
      const lionBody = new THREE.Mesh(lionBodyGeo, goldMat);
      lionBody.position.y = 0.4;

      const maneGeo = new THREE.DodecahedronGeometry(0.55, 0);
      const mane = new THREE.Mesh(maneGeo, darkManeMat);
      mane.position.set(0.4, 0.7, 0);

      const headGeo = new THREE.ConeGeometry(0.35, 0.5, 4);
      const head = new THREE.Mesh(headGeo, goldMat);
      head.rotation.z = -Math.PI / 2;
      head.position.set(0.75, 0.65, 0);

      group.add(lionBody, mane, head);
    } else if (data.id === 'canada') {
      // Canadian Maple Leaf Neon Emblem & Futuristic Skyline Pillar
      const pedestalGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedMat);
      pedestal.position.y = 0.6;

      // Glowing Neon Red Maple Leaf (approximated via 3 faceted diamond leaves)
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.85,
        metalness: 0.3,
        roughness: 0.2
      });

      const centerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 4), leafMat);
      centerLeaf.position.set(0, 1.6, 0);

      const leftLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), leafMat);
      leftLeaf.rotation.z = Math.PI / 4;
      leftLeaf.position.set(-0.35, 1.45, 0);

      const rightLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), leafMat);
      rightLeaf.rotation.z = -Math.PI / 4;
      rightLeaf.position.set(0.35, 1.45, 0);

      group.add(pedestal, centerLeaf, leftLeaf, rightLeaf);
    }

    group.position.set(x, y, 0);
    this.scene.add(group);

    this.easterEggs.push({
      data,
      mesh: group,
      found: false
    });
  }

  private buildCelestialParents() {
    // Two radiant guardian lights in the sky near Star 4 (X ≈ 116)
    // Symbolizing Mom & Dad accompanying Jonathan with warmth
    const orbGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.95
    });

    this.parentOrbA = new THREE.Mesh(orbGeo, orbMat);
    this.parentOrbA.position.set(113, 16.8, -3.5);
    this.parentLightA = new THREE.PointLight(0xfef08a, 3.2, 20);
    this.parentOrbA.add(this.parentLightA);

    this.parentOrbB = new THREE.Mesh(orbGeo, orbMat);
    this.parentOrbB.position.set(118, 17.8, -3.0);
    this.parentLightB = new THREE.PointLight(0xffedd5, 3.2, 20);
    this.parentOrbB.add(this.parentLightB);

    // Radiant celestial halo rings
    const auraGeo = new THREE.RingGeometry(0.8, 1.4, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const auraA = new THREE.Mesh(auraGeo, auraMat);
    const auraB = new THREE.Mesh(auraGeo, auraMat);
    this.parentOrbA.add(auraA);
    this.parentOrbB.add(auraB);

    this.scene.add(this.parentOrbA, this.parentOrbB);
  }

  private buildMainstageArch(x: number, y: number) {
    const stageGroup = new THREE.Group();

    // Festival Truss Pillars (Steel lattice aesthetic)
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.5, 0.9), trussMat);
    pillarL.position.set(-3.2, 3.25, 0);

    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.5, 0.9), trussMat);
    pillarR.position.set(3.2, 3.25, 0);

    // Roof Truss
    const roofTruss = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.9, 1.2), trussMat);
    roofTruss.position.set(0, 6.8, 0);

    // Neon "JONAMS" Header Board
    const signBoardMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65
    });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, 0.15), signBoardMat);
    signBoard.position.set(0, 5.5, 0.5);

    // Spotlights on top of the stage
    for (let sp = -2; sp <= 2; sp += 2) {
      const spotMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      spotMesh.position.set(sp, 7.3, 0);
      stageGroup.add(spotMesh);
    }

    stageGroup.add(pillarL, pillarR, roofTruss, signBoard);
    stageGroup.position.set(x, y, 0);
    this.scene.add(stageGroup);
  }

  private buildBackgroundScenery() {
    // Low-poly sunset mountains with warm rim lighting
    const mountainMatA = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b, // Deep indigo twilight
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const mountainMatB = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark slate horizon
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    for (let i = 0; i < 20; i++) {
      const radius = 7 + Math.random() * 9;
      const height = 14 + Math.random() * 16;
      const mGeo = new THREE.ConeGeometry(radius, height, 5);
      const isDistant = i % 2 === 0;
      const mesh = new THREE.Mesh(mGeo, isDistant ? mountainMatB : mountainMatA);
      mesh.position.set(i * 11 - 25, height / 2 - 8, -14 - Math.random() * 10);
      mesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mesh);
    }

    // Glowing Sunset Twilight Horizon Orbs (Simulating distant sunset / city festival lights)
    const duskColors = [0xf59e0b, 0xd946ef, 0x6366f1, 0xec4899];
    for (let i = 0; i < 12; i++) {
      const orbGeo = new THREE.SphereGeometry(1.5 + Math.random() * 1.5, 12, 12);
      const orbMat = new THREE.MeshBasicMaterial({
        color: duskColors[i % duskColors.length],
        transparent: true,
        opacity: 0.15
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(i * 16 - 15, 8 + Math.random() * 6, -18 - Math.random() * 6);
      this.duskOrbs.push(orb);
      this.scene.add(orb);
    }
  }

  // Input Handlers
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.input.jump = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.input.jump = false;
      this.lastJumpPressed = false;
    }
  };

  public setInput(control: 'left' | 'right' | 'jump', active: boolean) {
    this.input[control] = active;
    if (!active && control === 'jump') {
      this.lastJumpPressed = false;
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public resumeAfterStar() {
    this.isPaused = false;
    this.isCelebrating = false;
    // Restore normal SoundCloud volume
    setSoundCloudVolume(85);
    // Set respawn checkpoint at current star position
    this.respawnX = this.playerPos.x;
    this.respawnY = this.playerPos.y;
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private updatePhysics(delta: number) {
    if (this.isPaused) return;

    // DJ Celebration pose when collecting a star
    if (this.isCelebrating) {
      this.celebrationTimer += delta;
      // Hands in the air like headlining a festival
      this.playerGroup.position.y = this.playerPos.y + Math.sin(this.celebrationTimer * 8) * 0.22;
      this.playerLeftArm.rotation.z = Math.PI * 0.85;
      this.playerRightArm.rotation.z = -Math.PI * 0.85;
      this.playerHead.rotation.x = -0.35;
      return;
    }

    const moveSpeed = 9.8;
    const gravity = 28;
    const jumpStrength = 13.6;

    // Horizontal Movement
    if (this.input.left) {
      this.playerVel.x = -moveSpeed;
      this.facing = -1;
      this.runCycle += delta * 14;
    } else if (this.input.right) {
      this.playerVel.x = moveSpeed;
      this.facing = 1;
      this.runCycle += delta * 14;
    } else {
      this.playerVel.x *= 0.7; // friction
      this.runCycle = 0;
    }

    // Facing direction
    this.playerGroup.rotation.y = this.facing === 1 ? Math.PI * 0.15 : -Math.PI * 0.85;

    // Jump
    if (this.input.jump && this.isGrounded && !this.lastJumpPressed) {
      this.playerVel.y = jumpStrength;
      this.isGrounded = false;
      this.lastJumpPressed = true;
      playJumpSound();
    }

    // Apply gravity
    this.playerVel.y -= gravity * delta;
    if (this.playerVel.y < -22) this.playerVel.y = -22;

    const nextX = this.playerPos.x + this.playerVel.x * delta;
    const nextY = this.playerPos.y + this.playerVel.y * delta;

    // Platform collisions
    let landed = false;
    const playerWidth = 0.8;

    for (const p of this.platforms) {
      const pLeft = p.x - p.width / 2;
      const pRight = p.x + p.width / 2;
      const pTop = p.y;

      if (nextX + playerWidth / 2 >= pLeft && nextX - playerWidth / 2 <= pRight) {
        if (this.playerPos.y >= pTop - 0.12 && nextY <= pTop) {
          this.playerPos.y = pTop;
          this.playerVel.y = 0;
          landed = true;
          break;
        }
      }
    }

    this.isGrounded = landed;
    if (!landed) {
      this.playerPos.y = nextY;
    }
    this.playerPos.x = nextX;

    // Respawn check if falling
    if (this.playerPos.y < -8) {
      this.playerPos.x = Math.max(0, this.respawnX);
      this.playerPos.y = this.respawnY + 2;
      this.playerVel.x = 0;
      this.playerVel.y = 0;
    }

    // Sync group position
    this.playerGroup.position.set(this.playerPos.x, this.playerPos.y, 0);

    // Drop shadow
    this.playerShadow.position.x = this.playerPos.x;
    let groundBelow = -10;
    for (const p of this.platforms) {
      const pLeft = p.x - p.width / 2;
      const pRight = p.x + p.width / 2;
      if (this.playerPos.x >= pLeft && this.playerPos.x <= pRight && p.y <= this.playerPos.y + 0.1) {
        if (p.y > groundBelow) groundBelow = p.y;
      }
    }
    this.playerShadow.position.y = groundBelow + 0.05;
    const distToGround = Math.max(0, this.playerPos.y - groundBelow);
    const shadowScale = Math.max(0.3, 1 - distToGround * 0.1);
    this.playerShadow.scale.set(shadowScale, shadowScale, shadowScale);
    (this.playerShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.12, 0.45 - distToGround * 0.06);

    // Running & jumping animation
    if (!this.isGrounded) {
      this.playerLeftLeg.rotation.x = -0.55;
      this.playerRightLeg.rotation.x = 0.4;
      this.playerLeftArm.rotation.x = 0.75;
      this.playerRightArm.rotation.x = -0.75;
    } else if (Math.abs(this.playerVel.x) > 0.5) {
      this.playerLeftLeg.rotation.x = Math.sin(this.runCycle) * 0.65;
      this.playerRightLeg.rotation.x = -Math.sin(this.runCycle) * 0.65;
      this.playerLeftArm.rotation.x = -Math.sin(this.runCycle) * 0.65;
      this.playerRightArm.rotation.x = Math.sin(this.runCycle) * 0.65;
    } else {
      this.playerLeftLeg.rotation.x = 0;
      this.playerRightLeg.rotation.x = 0;
      this.playerLeftArm.rotation.x = 0;
      this.playerRightArm.rotation.x = 0;
      // Head nodding slightly to the house beat!
      this.playerHead.rotation.x = Math.sin(Date.now() * 0.007) * 0.06;
    }

    // Dynamic Camera tracking
    const targetCamX = this.playerPos.x + this.facing * 1.5;
    const targetCamY = Math.max(4.5, this.playerPos.y + 2.5);
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
    this.camera.lookAt(this.camera.position.x, this.camera.position.y - 1, 0);

    // Check Star Intersections
    for (const star of this.stars) {
      if (star.collected) continue;

      const dx = this.playerPos.x - star.x;
      const dy = (this.playerPos.y + 1) - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.6) {
        star.collected = true;
        this.collectedStarsCount++;
        this.callbacks.onStarCountUpdate(this.collectedStarsCount);
        this.isCelebrating = true;
        this.celebrationTimer = 0;
        this.setPaused(true);

        // Duck SoundCloud music gently to 30% while reading
        setSoundCloudVolume(30);

        playStarSound();
        star.mesh.visible = false;
        this.callbacks.onStarCollect(star.index, star.chapter);
        break;
      }
    }

    // Check Easter Egg proximity
    for (const egg of this.easterEggs) {
      if (egg.found) continue;
      const dx = this.playerPos.x - egg.data.x;
      const dy = (this.playerPos.y + 1) - egg.data.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2.0) {
        egg.found = true;
        playEasterEggSound();
        this.callbacks.onEasterEggFound(egg.data);
      }
    }

    // Check Final Goal Dais
    if (this.playerPos.x >= 155 && this.collectedStarsCount >= 5) {
      this.callbacks.onReachGoal();
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = 0.016;
    const time = Date.now() * 0.001;

    // Rotate spinning golden stars and soundwave rings
    for (const star of this.stars) {
      if (!star.collected) {
        star.mesh.rotation.y += 0.035;
        star.mesh.position.y = star.y + Math.sin(time * 3 + star.index) * 0.22;
        star.rings.forEach((ring, rIdx) => {
          ring.rotation.z += 0.02 * (rIdx === 0 ? 1 : -1);
          const scale = 1 + Math.sin(time * 5 + rIdx) * 0.12;
          ring.scale.set(scale, scale, scale);
        });
      }
    }

    // Animate festival laser beams sweeping across the night sky
    for (const laser of this.lasers) {
      laser.mesh.rotation.z = laser.baseRotZ + Math.sin(time * laser.speed + laser.phase) * 0.3;
    }

    // Subtle bass pulse on subwoofer speaker cones
    const bassPulse = 1 + Math.sin(time * 8) * 0.08;
    for (const cone of this.speakerCones) {
      cone.scale.set(bassPulse, bassPulse, bassPulse);
    }

    // Animate Easter eggs
    for (const egg of this.easterEggs) {
      egg.mesh.rotation.y += 0.02;
      egg.mesh.position.y = egg.data.y + Math.sin(time * 2 + egg.mesh.id) * 0.14;
    }

    // Animate Celestial Parents' orbs (Mom & Dad)
    if (this.parentOrbA && this.parentOrbB) {
      this.parentOrbA.position.y = 16.8 + Math.sin(time * 1.5) * 0.5;
      this.parentOrbB.position.y = 17.8 + Math.cos(time * 1.3) * 0.6;
      this.parentLightA.intensity = 2.4 + Math.sin(time * 3) * 0.8;
      this.parentLightB.intensity = 2.4 + Math.cos(time * 3) * 0.8;
    }

    // Pulse DJ headphone LED earcups
    const cupGlow = 0.5 + Math.sin(time * 6) * 0.3;
    for (const cup of this.headphoneCups) {
      const mat = cup.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = cupGlow;
      }
    }

    this.updatePhysics(delta);
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}
