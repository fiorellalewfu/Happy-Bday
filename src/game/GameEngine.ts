import * as THREE from 'three';
import { LetterChapter, EasterEgg } from '../types';
import {
  playJumpSound,
  playStarSound,
  playEasterEggSound,
  playSuperStarEvolutionSound,
  playCelestialFanfare,
  playCelestialFlightSound
} from '../audio/soundEffects';
import { setSoundCloudVolume } from '../audio/soundcloudManager';

export interface GameEngineCallbacks {
  onStarCollect: (starIndex: number, chapter: LetterChapter, isSuperDJ: boolean, canFly: boolean) => void;
  onEasterEggFound: (egg: EasterEgg) => void;
  onReachGoal: () => void;
  onStarCountUpdate: (count: number) => void;
  onEvolution?: () => void;
  onFlightUnlocked?: () => void;
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

  // Flight ability & Celestial Wings (Unlocked at Star 4)
  private canFly = false;
  private isFlying = false;
  private flightWingsGroup!: THREE.Group;
  private wingLeft!: THREE.Group;
  private wingRight!: THREE.Group;
  private guardianOrbsGroup!: THREE.Group;
  private guardianOrbA!: THREE.Mesh;
  private guardianOrbB!: THREE.Mesh;
  private celestialTrailSpawnTimer = 0;

  // Super DJ Evolution State (Mario Super Star Power!)
  private isSuperDJ = false;
  private superDJTimer = 0;
  private headphonesGroup!: THREE.Group;
  private superStarAuraGroup!: THREE.Group;
  private auraShieldA!: THREE.Mesh;
  private auraShieldB!: THREE.Mesh;
  private auraShieldMatA!: THREE.MeshBasicMaterial;
  private auraShieldMatB!: THREE.MeshBasicMaterial;
  private auraCrownStar!: THREE.Mesh;
  private auraCrownMat!: THREE.MeshStandardMaterial;
  private auraPointLight!: THREE.PointLight;
  private trailParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vy: number; rotSpeed: number }[] = [];
  private trailParticlePool: THREE.Mesh[] = [];
  private trailSpawnTimer = 0;

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

  // Celestial Lights (Parents - Mom & Dad) Destellos, Flares & Beacons
  private parentLightA!: THREE.PointLight;
  private parentLightB!: THREE.PointLight;
  private parentOrbA!: THREE.Group;
  private parentOrbB!: THREE.Group;
  private parentFlareRaysA: THREE.Mesh[] = [];
  private parentFlareRaysB: THREE.Mesh[] = [];
  private parentGodRayA!: THREE.Mesh;
  private parentGodRayB!: THREE.Mesh;
  private parentHaloRingsA: THREE.Mesh[] = [];
  private parentHaloRingsB: THREE.Mesh[] = [];
  private parentOrbitingSparks: { mesh: THREE.Mesh; parentGroup: THREE.Group; angle: number; speed: number; radius: number; heightOffset: number }[] = [];

  // Laser beams & concert spotlights
  private lasers: { mesh: THREE.Mesh; baseRotZ: number; speed: number; phase: number }[] = [];
  private speakerCones: THREE.Mesh[] = [];

  // Final DJ Set & Mixing State (Mainstage Goal Reached)
  private isFinalSetDJing = false;
  private djPlatterLeft!: THREE.Mesh;
  private djPlatterRight!: THREE.Mesh;
  private mixerLedBars: THREE.Mesh[] = [];
  private spectrumBars: THREE.Mesh[] = [];
  private stageStrobeLight!: THREE.PointLight;

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
    this.setupTrailParticles();
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

    // DJ HEADPHONES (Equipped when evolving to Super DJ!)
    this.headphonesGroup = new THREE.Group();
    this.headphonesGroup.visible = false;

    const bandGeo = new THREE.TorusGeometry(0.48, 0.06, 6, 16, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.45, 0);
    this.headphonesGroup.add(band);

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
    this.headphonesGroup.add(cupL, cupR);
    this.playerHead.add(this.headphonesGroup);
    this.playerGroup.add(this.playerHead);

    // SUPER STAR DJ AURA (Mario Invincible Star power aesthetic)
    this.superStarAuraGroup = new THREE.Group();
    this.superStarAuraGroup.visible = false;

    // Prismatic Rotating Ring A
    const ringGeoA = new THREE.TorusGeometry(1.26, 0.045, 8, 32);
    this.auraShieldMatA = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.85,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    this.auraShieldA = new THREE.Mesh(ringGeoA, this.auraShieldMatA);
    this.auraShieldA.position.y = 1.1;

    // Prismatic Rotating Ring B (cross angle)
    const ringGeoB = new THREE.TorusGeometry(1.38, 0.035, 8, 32);
    this.auraShieldMatB = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    this.auraShieldB = new THREE.Mesh(ringGeoB, this.auraShieldMatB);
    this.auraShieldB.rotation.x = Math.PI / 2;
    this.auraShieldB.position.y = 1.1;

    // Hovering Diamond Star Crown above head
    const crownStarGeo = new THREE.OctahedronGeometry(0.34, 0);
    this.auraCrownMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95,
      metalness: 0.9,
      roughness: 0.1
    });
    this.auraCrownStar = new THREE.Mesh(crownStarGeo, this.auraCrownMat);
    this.auraCrownStar.position.set(0, 2.75, 0);

    // Dynamic light radiating on platforms & world around player
    this.auraPointLight = new THREE.PointLight(0xfacc15, 0, 10);
    this.auraPointLight.position.set(0, 1.6, 0);

    this.superStarAuraGroup.add(this.auraShieldA, this.auraShieldB, this.auraCrownStar, this.auraPointLight);
    this.playerGroup.add(this.superStarAuraGroup);

    // CELESTIAL WINGS OF LIGHT (Unlocked at Star 4 - Dos Luces en el Cielo)
    this.flightWingsGroup = new THREE.Group();
    this.flightWingsGroup.position.set(0, 1.45, -0.32);
    this.flightWingsGroup.visible = false;

    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const wingCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    // Left Wing
    this.wingLeft = new THREE.Group();
    const featherGeo1 = new THREE.ConeGeometry(0.24, 1.35, 4);
    featherGeo1.rotateZ(-Math.PI / 3);
    const wL1 = new THREE.Mesh(featherGeo1, wingMat);
    wL1.position.set(-0.65, 0.45, 0);

    const featherGeo2 = new THREE.ConeGeometry(0.2, 1.1, 4);
    featherGeo2.rotateZ(-Math.PI / 4);
    const wL2 = new THREE.Mesh(featherGeo2, wingMat);
    wL2.position.set(-0.55, 0.1, 0);

    const featherGeo3 = new THREE.ConeGeometry(0.16, 0.85, 4);
    featherGeo3.rotateZ(-Math.PI / 6);
    const wL3 = new THREE.Mesh(featherGeo3, wingMat);
    wL3.position.set(-0.42, -0.22, 0);

    const wingRootL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), wingCoreMat);
    wingRootL.position.set(-0.15, 0.1, 0);

    this.wingLeft.add(wL1, wL2, wL3, wingRootL);

    // Right Wing
    this.wingRight = new THREE.Group();
    const featherGeoR1 = new THREE.ConeGeometry(0.24, 1.35, 4);
    featherGeoR1.rotateZ(Math.PI / 3);
    const wR1 = new THREE.Mesh(featherGeoR1, wingMat);
    wR1.position.set(0.65, 0.45, 0);

    const featherGeoR2 = new THREE.ConeGeometry(0.2, 1.1, 4);
    featherGeoR2.rotateZ(Math.PI / 4);
    const wR2 = new THREE.Mesh(featherGeoR2, wingMat);
    wR2.position.set(0.55, 0.1, 0);

    const featherGeoR3 = new THREE.ConeGeometry(0.16, 0.85, 4);
    featherGeoR3.rotateZ(Math.PI / 6);
    const wR3 = new THREE.Mesh(featherGeoR3, wingMat);
    wR3.position.set(0.42, -0.22, 0);

    const wingRootR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), wingCoreMat);
    wingRootR.position.set(0.15, 0.1, 0);

    this.wingRight.add(wR1, wR2, wR3, wingRootR);
    this.flightWingsGroup.add(this.wingLeft, this.wingRight);
    this.playerGroup.add(this.flightWingsGroup);

    // MINI GUARDIAN ORBS (Mom & Dad protecting and accompanying Jonathan in flight)
    this.guardianOrbsGroup = new THREE.Group();
    this.guardianOrbsGroup.visible = false;

    const miniOrbGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const miniOrbMatA = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const miniOrbMatB = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    this.guardianOrbA = new THREE.Mesh(miniOrbGeo, miniOrbMatA);
    const miniLightA = new THREE.PointLight(0xfef08a, 1.5, 6);
    this.guardianOrbA.add(miniLightA);

    this.guardianOrbB = new THREE.Mesh(miniOrbGeo, miniOrbMatB);
    const miniLightB = new THREE.PointLight(0xffedd5, 1.5, 6);
    this.guardianOrbB.add(miniLightB);

    this.guardianOrbsGroup.add(this.guardianOrbA, this.guardianOrbB);
    this.playerGroup.add(this.guardianOrbsGroup);

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
    // Symbolizing Mom & Dad accompanying Jonathan with a radiant super-power aura & destellos
    this.parentOrbA = new THREE.Group();
    this.parentOrbA.position.set(113, 17.5, -3.5);

    this.parentOrbB = new THREE.Group();
    this.parentOrbB.position.set(118, 18.5, -3.0);

    const createParentBeacon = (
      group: THREE.Group,
      colorHex: number,
      flareList: THREE.Mesh[],
      haloList: THREE.Mesh[],
      isMom: boolean
    ) => {
      // 1. Core brilliant star crystal
      const coreGeo = new THREE.SphereGeometry(0.72, 20, 20);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // 2. Glowing outer mantle
      const mantleGeo = new THREE.SphereGeometry(1.1, 16, 16);
      const mantleMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const mantle = new THREE.Mesh(mantleGeo, mantleMat);
      group.add(mantle);

      // 3. Destellos Estelares en Cruz (Starburst Lens Flares / Super Power Rays)
      const flareMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      // Horizontal ray
      const rayH = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 0.42), flareMat);
      // Vertical ray
      const rayV = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 6.8), flareMat);
      // Diagonal 45 deg ray
      const rayD1 = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.32), flareMat);
      rayD1.rotation.z = Math.PI / 4;
      // Diagonal -45 deg ray
      const rayD2 = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.32), flareMat);
      rayD2.rotation.z = -Math.PI / 4;

      group.add(rayH, rayV, rayD1, rayD2);
      flareList.push(rayH, rayV, rayD1, rayD2);

      // 4. Coronal Aura Rings (expanding super-power heartbeats)
      const ringMat1 = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });

      const ring1 = new THREE.Mesh(new THREE.RingGeometry(1.0, 2.2, 32), ringMat1);
      const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.0, 3.6, 32), ringMat2);
      group.add(ring1, ring2);
      haloList.push(ring1, ring2);

      // 5. Descending God-Ray (Beam of heavenly light down to the platform below)
      const godRayGeo = new THREE.CylinderGeometry(0.4, 4.8, 22, 16, 1, true);
      const godRayMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const godRay = new THREE.Mesh(godRayGeo, godRayMat);
      godRay.position.y = -10.5;
      group.add(godRay);

      if (isMom) {
        this.parentGodRayA = godRay;
      } else {
        this.parentGodRayB = godRay;
      }

      // 6. Orbiting Guardian Sparks
      for (let sp = 0; sp < 4; sp++) {
        const sparkGeo = new THREE.OctahedronGeometry(0.18, 0);
        const sparkMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
        group.add(sparkMesh);

        this.parentOrbitingSparks.push({
          mesh: sparkMesh,
          parentGroup: group,
          angle: (sp * Math.PI) / 2,
          speed: 1.4 + sp * 0.4,
          radius: 1.6 + (sp % 2) * 0.7,
          heightOffset: (sp - 1.5) * 0.35
        });
      }

      // 7. Dynamic High-Reach Point Light with Destellos
      const pLight = new THREE.PointLight(colorHex, 4.2, 35);
      group.add(pLight);
      return pLight;
    };

    // Mamá (Golden Celestial Warmth)
    this.parentLightA = createParentBeacon(
      this.parentOrbA,
      0xfef08a,
      this.parentFlareRaysA,
      this.parentHaloRingsA,
      true
    );

    // Papá (Diamond Pearl Radiance)
    this.parentLightB = createParentBeacon(
      this.parentOrbB,
      0xffedd5,
      this.parentFlareRaysB,
      this.parentHaloRingsB,
      false
    );

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

    // ==========================================
    // MAINSTAGE DJ BOOTH & SET LIST DESK
    // ==========================================
    const boothDeskMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Matte dark carbon finish
      roughness: 0.35,
      metalness: 0.7
    });

    // DJ Desk Base (Table)
    const deskBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.05, 0.9),
      boothDeskMat
    );
    deskBase.position.set(0, 0.525, 0.8);
    stageGroup.add(deskBase);

    // Front illuminated LED fascia / sign board
    const frontFascia = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 0.55, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x09090b,
        emissive: 0x1e1b4b,
        emissiveIntensity: 0.5
      })
    );
    frontFascia.position.set(0, 0.55, 1.27);
    stageGroup.add(frontFascia);

    // Neon Accent Trim on Desk
    const deskTrim = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.06, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    deskTrim.position.set(0, 1.02, 1.26);
    stageGroup.add(deskTrim);

    // Audio Spectrum Visualizer Bars along the front fascia
    this.spectrumBars = [];
    const specColors = [0x10b981, 0x10b981, 0x06b6d4, 0x06b6d4, 0xfacc15, 0xfacc15, 0xf59e0b, 0xf97316, 0xef4444, 0xec4899];
    for (let i = 0; i < 10; i++) {
      const bx = -1.2 + i * 0.265;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.35, 0.04),
        new THREE.MeshBasicMaterial({ color: specColors[i] })
      );
      bar.position.set(bx, 0.55, 1.3);
      this.spectrumBars.push(bar);
      stageGroup.add(bar);
    }

    // ==========================================
    // DJ EQUIPMENT ON THE TABLE
    // ==========================================
    const cdjMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.8
    });

    const platterMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.95,
      roughness: 0.15
    });

    // LEFT CDJ PLAYER (x = -0.85, y = 1.1, z = 0.8)
    const cdjBaseGeo = new THREE.BoxGeometry(0.72, 0.1, 0.78);
    const cdjLeft = new THREE.Mesh(cdjBaseGeo, cdjMat);
    cdjLeft.position.set(-0.85, 1.1, 0.8);
    stageGroup.add(cdjLeft);

    // Left Jog Wheel (Platter)
    const platterGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24);
    this.djPlatterLeft = new THREE.Mesh(platterGeo, platterMat);
    this.djPlatterLeft.position.set(-0.85, 1.17, 0.82);
    const ledRingLeft = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.018, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    ledRingLeft.rotation.x = Math.PI / 2;
    this.djPlatterLeft.add(ledRingLeft);
    stageGroup.add(this.djPlatterLeft);

    // Left CDJ Angled Screen (Waveform display)
    const cdjScreenLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.22, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    cdjScreenLeft.position.set(-0.85, 1.25, 0.56);
    cdjScreenLeft.rotation.x = -Math.PI / 4;
    stageGroup.add(cdjScreenLeft);

    // RIGHT CDJ PLAYER (x = 0.85, y = 1.1, z = 0.8)
    const cdjRight = new THREE.Mesh(cdjBaseGeo, cdjMat);
    cdjRight.position.set(0.85, 1.1, 0.8);
    stageGroup.add(cdjRight);

    // Right Jog Wheel (Platter)
    this.djPlatterRight = new THREE.Mesh(platterGeo, platterMat);
    this.djPlatterRight.position.set(0.85, 1.17, 0.82);
    const ledRingRight = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.018, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    ledRingRight.rotation.x = Math.PI / 2;
    this.djPlatterRight.add(ledRingRight);
    stageGroup.add(this.djPlatterRight);

    // Right CDJ Angled Screen
    const cdjScreenRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.22, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    cdjScreenRight.position.set(0.85, 1.25, 0.56);
    cdjScreenRight.rotation.x = -Math.PI / 4;
    stageGroup.add(cdjScreenRight);

    // 4-CHANNEL PRO MIXER (x = 0, y = 1.1, z = 0.8)
    const mixerChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.1, 0.78),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.8, roughness: 0.3 })
    );
    mixerChassis.position.set(0, 1.1, 0.8);
    stageGroup.add(mixerChassis);

    // Mixer Crossfader & EQ Knobs
    const crossfader = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    );
    crossfader.position.set(0.04, 1.17, 1.05);
    stageGroup.add(crossfader);

    // Mixer Stereo VU Level Meters (LEDs)
    this.mixerLedBars = [];
    for (let side = -1; side <= 1; side += 2) {
      const vuBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.22, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      vuBar.position.set(side * 0.07, 1.16, 0.78);
      vuBar.rotation.x = -Math.PI / 2;
      this.mixerLedBars.push(vuBar);
      stageGroup.add(vuBar);
    }

    // Small EQ Rotary Knobs
    for (let kx = -0.16; kx <= 0.16; kx += 0.1) {
      for (let kz = 0.58; kz <= 0.88; kz += 0.12) {
        const knob = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.04, 8),
          new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
        );
        knob.position.set(kx, 1.17, kz);
        stageGroup.add(knob);
      }
    }

    // ==========================================
    // SET LIST & LAPTOP MONITOR STAND
    // ==========================================
    const standPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
    );
    standPole.position.set(-0.35, 1.3, 0.95);
    stageGroup.add(standPole);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.35, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.7
      })
    );
    laptopScreen.position.set(-0.35, 1.52, 0.95);
    laptopScreen.rotation.x = -Math.PI / 5;
    laptopScreen.rotation.y = 0.2;
    stageGroup.add(laptopScreen);

    // Laptop Track Waveform Strip
    const waveformStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.08, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    waveformStrip.position.set(-0.35, 1.52, 0.97);
    waveformStrip.rotation.x = -Math.PI / 5;
    waveformStrip.rotation.y = 0.2;
    stageGroup.add(waveformStrip);

    // ==========================================
    // BOOTH MONITOR SPEAKERS (Wedge angled monitors)
    // ==========================================
    const monitorGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const monL = new THREE.Mesh(monitorGeo, monitorMat);
    monL.position.set(-2.0, 0.35, 0.8);
    monL.rotation.y = Math.PI / 5;
    monL.rotation.x = -Math.PI / 10;
    stageGroup.add(monL);

    const monR = new THREE.Mesh(monitorGeo, monitorMat);
    monR.position.set(2.0, 0.35, 0.8);
    monR.rotation.y = -Math.PI / 5;
    monR.rotation.x = -Math.PI / 10;
    stageGroup.add(monR);

    // STAGE CRYO CO2 JET CANNONS
    const co2Mat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const co2L = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 12), co2Mat);
    co2L.position.set(-2.85, 0.3, 1.1);
    co2L.rotation.z = -0.25;
    stageGroup.add(co2L);

    const co2R = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 12), co2Mat);
    co2R.position.set(2.85, 0.3, 1.1);
    co2R.rotation.z = 0.25;
    stageGroup.add(co2R);

    // STAGE STROBE / POINT LIGHT
    this.stageStrobeLight = new THREE.PointLight(0xffedd5, 1.2, 16);
    this.stageStrobeLight.position.set(0, 4.2, 1.5);
    stageGroup.add(this.stageStrobeLight);
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

  private setupTrailParticles() {
    const starGeo = new THREE.OctahedronGeometry(0.15, 0);
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(starGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.trailParticlePool.push(mesh);
    }
  }

  private spawnTrailParticle(time: number) {
    if (this.trailParticlePool.length === 0) return;
    const mesh = this.trailParticlePool.pop()!;
    mesh.visible = true;

    // Rainbow star color matching Mario star power
    const hue = (time * 1.8 + Math.random() * 0.2) % 1.0;
    (mesh.material as THREE.MeshBasicMaterial).color.setHSL(hue, 1.0, 0.6);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    mesh.scale.set(1, 1, 1);

    mesh.position.set(
      this.playerPos.x - this.facing * (0.2 + Math.random() * 0.3),
      this.playerPos.y + 0.3 + Math.random() * 0.9,
      (Math.random() - 0.5) * 0.4
    );

    this.trailParticles.push({
      mesh,
      life: 0.45,
      maxLife: 0.45,
      vx: -this.facing * (0.8 + Math.random() * 0.8),
      vy: (Math.random() - 0.2) * 1.2,
      rotSpeed: (Math.random() - 0.5) * 12
    });
  }

  private spawnCelestialTrailParticle(time: number) {
    if (this.trailParticlePool.length === 0) return;
    const mesh = this.trailParticlePool.pop()!;
    mesh.visible = true;

    // Glowing golden-white celestial stardust
    const isGold = Math.random() > 0.4;
    (mesh.material as THREE.MeshBasicMaterial).color.setHex(isGold ? 0xfef08a : 0xffffff);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    mesh.scale.set(1.2, 1.2, 1.2);

    mesh.position.set(
      this.playerPos.x - this.facing * (0.3 + Math.random() * 0.4),
      this.playerPos.y + 0.8 + (Math.random() - 0.5) * 0.6,
      -0.2 + (Math.random() - 0.5) * 0.4
    );

    this.trailParticles.push({
      mesh,
      life: 0.55,
      maxLife: 0.55,
      vx: -this.facing * (0.6 + Math.random() * 0.6),
      vy: -0.4 - Math.random() * 0.8,
      rotSpeed: (Math.random() - 0.5) * 8
    });
  }

  public evolveToSuperDJ() {
    if (this.isSuperDJ) return;
    this.isSuperDJ = true;
    this.headphonesGroup.visible = true;
    this.superStarAuraGroup.visible = true;
    this.auraPointLight.intensity = 3.5;

    // Mario Super Star / DJ Evolution fanfare
    playSuperStarEvolutionSound();

    if (this.callbacks.onEvolution) {
      this.callbacks.onEvolution();
    }
  }

  public unlockFlightPower() {
    if (this.canFly) return;
    this.canFly = true;
    this.flightWingsGroup.visible = true;
    this.guardianOrbsGroup.visible = true;

    // Celestial angelic fanfare sound
    playCelestialFanfare();

    if (this.callbacks.onFlightUnlocked) {
      this.callbacks.onFlightUnlocked();
    }
  }

  public getCanFly(): boolean {
    return this.canFly;
  }

  public getIsFlying(): boolean {
    return this.isFlying;
  }

  public getIsSuperDJ(): boolean {
    return this.isSuperDJ;
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private updatePhysics(delta: number, time: number) {
    // If headlining the festival on the mainstage, play DJ mixing animation!
    if (this.isFinalSetDJing) {
      this.updateDJMixingAnimation(time, delta);
      return;
    }

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

    const moveSpeed = this.canFly ? 13.5 : (this.isSuperDJ ? 12.2 : 9.8);
    const jumpStrength = this.isSuperDJ ? 15.2 : 13.6;

    // Horizontal Movement
    if (this.input.left) {
      this.playerVel.x = -moveSpeed;
      this.facing = -1;
      this.runCycle += delta * (this.isSuperDJ ? 18 : 14);
    } else if (this.input.right) {
      this.playerVel.x = moveSpeed;
      this.facing = 1;
      this.runCycle += delta * (this.isSuperDJ ? 18 : 14);
    } else {
      this.playerVel.x *= 0.7; // friction
      this.runCycle = 0;
    }

    // Facing direction
    this.playerGroup.rotation.y = this.facing === 1 ? Math.PI * 0.15 : -Math.PI * 0.85;

    // Jump & Flight Mechanic
    if (this.canFly) {
      if (this.input.jump) {
        if (this.isGrounded) {
          // Take-off leap
          this.playerVel.y = 15.5;
          this.isGrounded = false;
          this.isFlying = true;
          this.lastJumpPressed = true;
          playJumpSound();
          playCelestialFlightSound();
          this.spawnCelestialTrailParticle(Date.now() * 0.001);
        } else {
          // Airborne flight ascent
          this.isFlying = true;
          this.playerVel.y = Math.min(this.playerVel.y + 24 * delta, 11.5);
          playCelestialFlightSound();
          this.spawnCelestialTrailParticle(Date.now() * 0.001);
        }
      } else if (!this.isGrounded) {
        // Celestial gentle glide when falling
        this.playerVel.y -= 8.5 * delta;
        if (this.playerVel.y < -4.5) this.playerVel.y = -4.5;
      }
    } else {
      // Standard Ground Jump
      if (this.input.jump && this.isGrounded && !this.lastJumpPressed) {
        this.playerVel.y = jumpStrength;
        this.isGrounded = false;
        this.lastJumpPressed = true;
        playJumpSound();
        if (this.isSuperDJ) {
          for (let s = 0; s < 3; s++) {
            this.spawnTrailParticle(Date.now() * 0.001);
          }
        }
      }

      // Standard Gravity
      this.playerVel.y -= 28 * delta;
      if (this.playerVel.y < -22) this.playerVel.y = -22;
    }

    // Spawn trail particles during movement in Super DJ mode
    if (this.isSuperDJ && (Math.abs(this.playerVel.x) > 0.8 || !this.isGrounded)) {
      this.trailSpawnTimer += delta;
      if (this.trailSpawnTimer >= 0.04) {
        this.trailSpawnTimer = 0;
        this.spawnTrailParticle(Date.now() * 0.001);
      }
    }

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
          this.isFlying = false;
          break;
        }
      }
    }

    this.isGrounded = landed;
    if (landed) {
      this.isFlying = false;
    } else {
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
      this.playerLeftLeg.position.y = 0.4;
      this.playerRightLeg.position.y = 0.4;
      this.playerGroup.rotation.z = 0;
      this.playerLeftArm.rotation.y = 0;
      this.playerLeftArm.rotation.z = 0;
      this.playerRightArm.rotation.y = 0;
      this.playerRightArm.rotation.z = 0;
      this.playerHead.rotation.y = 0;
      this.playerHead.rotation.z = 0;
      this.playerLeftLeg.rotation.x = -0.55;
      this.playerRightLeg.rotation.x = 0.4;
      this.playerLeftArm.rotation.x = 0.75;
      this.playerRightArm.rotation.x = -0.75;
    } else if (Math.abs(this.playerVel.x) > 0.5) {
      this.playerLeftLeg.position.y = 0.4;
      this.playerRightLeg.position.y = 0.4;
      this.playerGroup.rotation.z = 0;
      this.playerLeftArm.rotation.y = 0;
      this.playerLeftArm.rotation.z = 0;
      this.playerRightArm.rotation.y = 0;
      this.playerRightArm.rotation.z = 0;
      this.playerHead.rotation.y = 0;
      this.playerHead.rotation.z = 0;
      this.playerLeftLeg.rotation.x = Math.sin(this.runCycle) * 0.65;
      this.playerRightLeg.rotation.x = -Math.sin(this.runCycle) * 0.65;
      this.playerLeftArm.rotation.x = -Math.sin(this.runCycle) * 0.65;
      this.playerRightArm.rotation.x = Math.sin(this.runCycle) * 0.65;
      this.playerHead.rotation.x = Math.sin(this.runCycle) * 0.1;
    } else {
      // Idle: Grooving and dancing to the house music rhythm!
      this.updateHouseDanceAnimation(time, delta);
    }

    // Dynamic Camera tracking with Mobile Portrait & Landscape auto-adaptation
    const aspect = this.camera.aspect;
    const isPortrait = aspect < 1.0;

    // In mobile portrait, gently pull back Z and raise Y so player and platforms are clearly visible above touch controls
    const targetCamZ = isPortrait ? 18.5 * Math.min(1.42, 0.88 / Math.max(0.48, aspect)) : 18.5;
    const targetCamX = this.playerPos.x + this.facing * (isPortrait ? 0.9 : 1.5);
    const targetCamY = Math.max(isPortrait ? 5.2 : 4.5, this.playerPos.y + (isPortrait ? 3.2 : 2.5));

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(this.camera.position.x, this.camera.position.y - (isPortrait ? 1.7 : 1.0), 0);

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

        // Check if Star 2 ("El hombre en el que te convertiste"): trigger DJ Evolution!
        if (star.index === 2 || star.chapter.id === 2 || star.chapter.specialEffect === 'dj-evolution') {
          this.evolveToSuperDJ();
        } else if (star.index === 4 || star.chapter.id === 4 || star.chapter.specialEffect === 'celestial-flight') {
          // Chapter 4 ("Dos Luces en el Cielo" - Mamá y Papá): Super Poder de Vuelo Celestial!
          this.unlockFlightPower();
        } else {
          playStarSound();
        }

        star.mesh.visible = false;
        this.callbacks.onStarCollect(star.index, star.chapter, this.isSuperDJ, this.canFly);
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

    // Check Final Goal Dais & DJ Booth Arrival
    if (this.playerPos.x >= 154 && this.collectedStarsCount >= 5 && !this.isFinalSetDJing) {
      this.startFinalDJSet();
      this.callbacks.onReachGoal();
    }
  }

  /**
   * House Music Dancing Animation when idle (124 BPM groove)
   */
  private updateHouseDanceAnimation(time: number, _delta: number) {
    const bpm = 124;
    const danceTime = time * (bpm / 60) * Math.PI; // ~13 rad/s

    const kick = Math.abs(Math.sin(danceTime));
    const halfBeat = Math.sin(danceTime * 0.5);

    // 1. Torso & Knee Jacking (The classic Chicago/House Music Jack)
    this.playerLeftLeg.position.y = 0.4 - kick * 0.05;
    this.playerRightLeg.position.y = 0.4 - (1 - kick) * 0.04;
    this.playerLeftLeg.rotation.x = Math.sin(danceTime) * 0.24;
    this.playerRightLeg.rotation.x = -Math.sin(danceTime) * 0.24;

    // Body sway & groove tilt
    this.playerGroup.rotation.z = halfBeat * 0.06;

    // 2. Head Nodding & Groove Tilt (vibing with the 4/4 beat)
    this.playerHead.rotation.x = -0.06 + Math.sin(danceTime * 2) * 0.16;
    this.playerHead.rotation.z = Math.sin(danceTime) * 0.12;
    this.playerHead.rotation.y = halfBeat * 0.2;

    // 3. Arms & Hands House Dance Moves
    // Left arm: bent at elbow, rhythm pump / finger snap
    this.playerLeftArm.rotation.x = -0.55 + Math.sin(danceTime) * 0.48;
    this.playerLeftArm.rotation.z = -0.32 - halfBeat * 0.18;
    this.playerLeftArm.rotation.y = 0.28;

    // Right arm: flowing wave / air pump
    this.playerRightArm.rotation.x = -0.45 - Math.cos(danceTime) * 0.52;
    this.playerRightArm.rotation.z = 0.32 + halfBeat * 0.18;
    this.playerRightArm.rotation.y = -0.28;

    // Super DJ mode extra energy
    if (this.isSuperDJ) {
      this.playerLeftArm.rotation.x = -0.85 + Math.sin(danceTime * 1.5) * 0.65;
      this.playerRightArm.rotation.x = -0.85 - Math.cos(danceTime * 1.5) * 0.65;
      this.playerHead.rotation.x = -0.12 + Math.sin(danceTime * 2) * 0.22;
    }
  }

  /**
   * Final Mainstage DJ Mixing Animation at the DJ Booth Table
   */
  private updateDJMixingAnimation(time: number, _delta: number) {
    const mixTime = time * 7.8;

    // Position behind the DJ table
    this.playerPos.x = 158.0;
    this.playerPos.z = 0.05;
    this.facing = 1;
    this.playerGroup.rotation.y = 0.18; // angled slightly towards crowd and camera

    // House beat bounce behind the decks
    const kickBounce = Math.abs(Math.sin(mixTime));
    this.playerGroup.position.y = 9.5 + kickBounce * 0.12;
    this.playerGroup.position.x = 158.0;
    this.playerGroup.position.z = 0.05;
    this.playerGroup.rotation.z = Math.sin(mixTime * 0.5) * 0.04;

    this.playerLeftLeg.rotation.x = Math.sin(mixTime) * 0.18;
    this.playerRightLeg.rotation.x = -Math.sin(mixTime) * 0.18;
    this.playerLeftLeg.position.y = 0.4;
    this.playerRightLeg.position.y = 0.4;

    // Cycle through 3 iconic DJ behaviors every 12 seconds
    const cycle = (time * 0.18) % 3;

    if (cycle < 1.0) {
      // Behavior 1: Cueing with Headphone to Ear & Tweaking EQ Knobs
      this.playerLeftArm.rotation.x = -1.65 + Math.sin(mixTime * 0.5) * 0.06;
      this.playerLeftArm.rotation.y = 0.82;
      this.playerLeftArm.rotation.z = -0.72;

      this.playerHead.rotation.z = -0.24 + Math.sin(mixTime * 2) * 0.04;
      this.playerHead.rotation.x = -0.06 + Math.sin(mixTime * 2) * 0.16;
      this.playerHead.rotation.y = 0.12;

      this.playerRightArm.rotation.x = -0.9 + Math.sin(mixTime * 1.5) * 0.22;
      this.playerRightArm.rotation.y = -0.28 + Math.cos(mixTime) * 0.18;
      this.playerRightArm.rotation.z = 0.15;
    } else if (cycle < 2.0) {
      // Behavior 2: Scratching CDJ Jog Wheel & Filter Sweep
      this.playerLeftArm.rotation.x = -0.92 + Math.sin(mixTime * 0.8) * 0.12;
      this.playerLeftArm.rotation.y = 0.22;
      this.playerLeftArm.rotation.z = -0.16;

      this.playerRightArm.rotation.x = -0.84 + Math.sin(mixTime * 4) * 0.2;
      this.playerRightArm.rotation.y = 0.32;
      this.playerRightArm.rotation.z = 0.18;

      this.playerHead.rotation.x = -0.1 + Math.sin(mixTime * 3) * 0.2;
      this.playerHead.rotation.z = Math.sin(mixTime * 1.5) * 0.08;
      this.playerHead.rotation.y = -0.1;
    } else {
      // Behavior 3: THE DROP! Hands in the air, hyping the crowd!
      this.playerRightArm.rotation.x = -2.6 + Math.sin(mixTime * 3) * 0.25;
      this.playerRightArm.rotation.z = 0.35;
      this.playerRightArm.rotation.y = 0.1;

      this.playerLeftArm.rotation.x = -2.3 + Math.sin(mixTime * 3 + 0.6) * 0.25;
      this.playerLeftArm.rotation.z = -0.35;
      this.playerLeftArm.rotation.y = -0.1;

      this.playerHead.rotation.x = -0.32;
      this.playerHead.rotation.z = Math.sin(mixTime * 2) * 0.06;
      this.playerHead.rotation.y = 0;
    }

    // Dynamic DJ Camera Tracking - Festival Mainstage Shot (Mobile Portrait & Landscape)
    const aspect = this.camera.aspect;
    const isPortrait = aspect < 1.0;
    const targetCamX = 158.0 + Math.sin(time * 0.35) * 0.6;
    const targetCamY = isPortrait ? 11.6 : 11.2;
    const targetCamZ = isPortrait ? 8.4 : 6.4;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.06;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.06;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;
    this.camera.lookAt(158.0, 10.7, 0.4);
  }

  /**
   * Activates the final DJ set when arriving at the mainstage
   */
  public startFinalDJSet() {
    this.isFinalSetDJing = true;
    this.playerPos.x = 158.0;
    this.playerPos.y = 9.5;
    this.playerPos.z = 0.05;
    this.playerVel.x = 0;
    this.playerVel.y = 0;
    this.facing = 1;
    this.isGrounded = true;
    this.isFlying = false;

    // Equip DJ headphones!
    if (this.headphonesGroup) {
      this.headphonesGroup.visible = true;
    }

    // Crank up SoundCloud volume to 100% full live set
    setSoundCloudVolume(100);
  }

  public getIsFinalSetDJing(): boolean {
    return this.isFinalSetDJing;
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
    const laserSpeedMult = this.isFinalSetDJing ? 2.2 : 1.0;
    const laserAmp = this.isFinalSetDJing ? 0.45 : 0.3;
    for (const laser of this.lasers) {
      laser.mesh.rotation.z = laser.baseRotZ + Math.sin(time * laser.speed * laserSpeedMult + laser.phase) * laserAmp;
    }

    // Animate DJ Table Decks & Mixer when on the mainstage
    if (this.djPlatterLeft && this.djPlatterRight) {
      const platterSpeed = this.isFinalSetDJing ? 4.5 : 1.2;
      this.djPlatterLeft.rotation.y += delta * platterSpeed;
      this.djPlatterRight.rotation.y += delta * platterSpeed;
    }

    // Animate Mixer Stereo VU Meters
    if (this.mixerLedBars.length > 0) {
      for (let i = 0; i < this.mixerLedBars.length; i++) {
        const bar = this.mixerLedBars[i];
        const val = Math.abs(Math.sin(time * 14 + i * 1.8));
        bar.scale.set(1, 0.3 + val * 0.9, 1);
        (bar.material as THREE.MeshBasicMaterial).color.setHex(
          val > 0.8 ? 0xef4444 : (val > 0.5 ? 0xfacc15 : 0x22c55e)
        );
      }
    }

    // Animate DJ Booth Front Audio Spectrum Visualizer
    if (this.spectrumBars.length > 0) {
      for (let i = 0; i < this.spectrumBars.length; i++) {
        const bar = this.spectrumBars[i];
        const val = Math.abs(Math.sin(time * 8 + i * 0.9) * Math.cos(time * 4 + i * 1.3));
        bar.scale.set(1, 0.2 + val * 1.1, 1);
      }
    }

    // Stage Strobe Light pulsing
    if (this.stageStrobeLight) {
      if (this.isFinalSetDJing) {
        this.stageStrobeLight.intensity = Math.sin(time * 18) > 0.6 ? 4.2 : 1.2;
      } else {
        this.stageStrobeLight.intensity = 1.0;
      }
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

    // Animate Celestial Parents' lights (Mom & Dad) with brilliant sparkling destellos
    if (this.parentOrbA && this.parentOrbB) {
      this.parentOrbA.position.y = 17.5 + Math.sin(time * 1.6) * 0.5;
      this.parentOrbB.position.y = 18.5 + Math.cos(time * 1.4) * 0.55;

      // Sparkling destello pulse (radiant super-power shimmer)
      const destelloA = Math.abs(Math.sin(time * 9) * Math.cos(time * 14));
      const destelloB = Math.abs(Math.cos(time * 8) * Math.sin(time * 15));

      this.parentLightA.intensity = 3.6 + destelloA * 2.8;
      this.parentLightB.intensity = 3.6 + destelloB * 2.8;

      // Rotating Starburst Flare Cross Rays
      for (const flare of this.parentFlareRaysA) {
        flare.rotation.z += 0.008;
        const s = 1 + destelloA * 0.65;
        flare.scale.set(s, s, 1);
        (flare.material as THREE.MeshBasicMaterial).opacity = 0.65 + destelloA * 0.35;
      }
      for (const flare of this.parentFlareRaysB) {
        flare.rotation.z -= 0.007;
        const s = 1 + destelloB * 0.65;
        flare.scale.set(s, s, 1);
        (flare.material as THREE.MeshBasicMaterial).opacity = 0.65 + destelloB * 0.35;
      }

      // Coronal Aura Rings
      for (let r = 0; r < this.parentHaloRingsA.length; r++) {
        const ringScale = 1 + Math.sin(time * 4 + r * 1.2) * 0.18;
        this.parentHaloRingsA[r].scale.set(ringScale, ringScale, ringScale);
        this.parentHaloRingsA[r].rotation.z += 0.015;
      }
      for (let r = 0; r < this.parentHaloRingsB.length; r++) {
        const ringScale = 1 + Math.sin(time * 4 + r * 1.2 + 1) * 0.18;
        this.parentHaloRingsB[r].scale.set(ringScale, ringScale, ringScale);
        this.parentHaloRingsB[r].rotation.z -= 0.015;
      }

      // God-Rays breathing celestial light
      if (this.parentGodRayA) {
        (this.parentGodRayA.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 2.5) * 0.09;
      }
      if (this.parentGodRayB) {
        (this.parentGodRayB.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.cos(time * 2.5) * 0.09;
      }

      // Orbiting Guardian Sparks
      for (const spark of this.parentOrbitingSparks) {
        spark.angle += delta * spark.speed;
        spark.mesh.position.x = Math.cos(spark.angle) * spark.radius;
        spark.mesh.position.z = Math.sin(spark.angle) * (spark.radius * 0.7);
        spark.mesh.position.y = spark.heightOffset + Math.sin(spark.angle * 2.5) * 0.3;
        spark.mesh.rotation.x += 0.05;
        spark.mesh.rotation.y += 0.05;
      }
    }

    // Flight Wings & Guardian Orbs Animation
    if (this.canFly) {
      // Guardian orbs floating near Jonathan's shoulders
      this.guardianOrbA.position.set(
        Math.cos(time * 3.5) * 0.85,
        1.45 + Math.sin(time * 3.5) * 0.18,
        Math.sin(time * 3.5) * 0.35
      );
      this.guardianOrbB.position.set(
        Math.cos(time * 3.5 + Math.PI) * 0.85,
        1.45 + Math.sin(time * 3.5 + Math.PI) * 0.18,
        Math.sin(time * 3.5 + Math.PI) * 0.35
      );

      // Wing flapping & aerodynamic soaring pose
      if (this.isFlying && !this.isGrounded) {
        const flapSpeed = this.input.jump ? 18 : 6;
        const flapAmp = this.input.jump ? 0.65 : 0.32;
        this.wingLeft.rotation.y = Math.sin(time * flapSpeed) * flapAmp;
        this.wingRight.rotation.y = -Math.sin(time * flapSpeed) * flapAmp;

        this.playerGroup.rotation.z = -this.facing * 0.22;
        this.playerLeftArm.rotation.x = -1.15;
        this.playerRightArm.rotation.x = -1.15;
        this.playerLeftLeg.rotation.x = 0.35;
        this.playerRightLeg.rotation.x = 0.35;

        // Spawn celestial stardust trail while soaring
        this.celestialTrailSpawnTimer += delta;
        if (this.celestialTrailSpawnTimer >= 0.05) {
          this.celestialTrailSpawnTimer = 0;
          this.spawnCelestialTrailParticle(time);
        }
      } else {
        // Wings gently folded back while grounded
        this.wingLeft.rotation.y = 0.2;
        this.wingRight.rotation.y = -0.2;
        this.playerGroup.rotation.z = 0;
      }
    }

    // Pulse DJ headphone LED earcups & Super Star Aura (Rainbow Mario Star power!)
    if (this.isSuperDJ) {
      this.superDJTimer += delta;
      const hue = (time * 1.6) % 1.0;
      const rainbowColor = new THREE.Color().setHSL(hue, 1.0, 0.55);
      const secondaryColor = new THREE.Color().setHSL((hue + 0.35) % 1.0, 1.0, 0.6);

      this.auraShieldMatA.color = rainbowColor;
      this.auraShieldMatB.color = secondaryColor;
      this.auraCrownMat.color = rainbowColor;
      this.auraCrownMat.emissive = rainbowColor;
      this.auraPointLight.color = rainbowColor;
      this.auraPointLight.intensity = 3.0 + Math.sin(time * 12) * 1.2;

      this.auraShieldA.rotation.z += 0.06;
      this.auraShieldA.rotation.y += 0.04;
      this.auraShieldB.rotation.x += 0.05;
      this.auraShieldB.rotation.z -= 0.04;

      const auraPulse = 1.0 + Math.sin(time * 10) * 0.1;
      this.auraShieldA.scale.set(auraPulse, auraPulse, auraPulse);
      this.auraShieldB.scale.set(auraPulse, auraPulse, auraPulse);

      this.auraCrownStar.rotation.y += 0.08;
      this.auraCrownStar.position.y = 2.75 + Math.sin(time * 6) * 0.12;

      for (const cup of this.headphoneCups) {
        const mat = cup.material as THREE.MeshStandardMaterial;
        mat.emissive = rainbowColor;
        mat.emissiveIntensity = 0.9 + Math.sin(time * 14) * 0.4;
      }
    } else {
      const cupGlow = 0.5 + Math.sin(time * 6) * 0.3;
      for (const cup of this.headphoneCups) {
        const mat = cup.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = cupGlow;
        }
      }
    }

    // Update active star trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life -= delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.rotation.z += p.rotSpeed * delta;
      const progress = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.set(progress, progress, progress);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = progress * 0.85;

      if (p.life <= 0) {
        p.mesh.visible = false;
        this.trailParticles.splice(i, 1);
        this.trailParticlePool.push(p.mesh);
      }
    }

    this.updatePhysics(delta, time);
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
