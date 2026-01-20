import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SceneObject, SceneData, Vector3 } from '../types';

interface UseThreeSceneOptions {
  onObjectSelect: (objectId: string | null) => void;
  sceneData: SceneData;
  cameraTransition?: {
    active: boolean;
    targetPosition?: Vector3;
    targetLookAt?: Vector3;
  };
}

interface ThreeSceneRefs {
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  controls: OrbitControls | null;
  objects: Map<string, THREE.Object3D>;
  animationId: number | null;
}

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseThreeSceneOptions
) {
  const refs = useRef<ThreeSceneRefs>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    objects: new Map(),
    animationId: null,
  });

  const { onObjectSelect, sceneData, cameraTransition } = options;

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneData.environment.background_color);
    scene.fog = new THREE.Fog(sceneData.environment.background_color, 30, 100);

    // Create camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(
      sceneData.camera.position.x,
      sceneData.camera.position.y,
      sceneData.camera.position.z
    );

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(
      sceneData.camera.target.x,
      sceneData.camera.target.y,
      sceneData.camera.target.z
    );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;

    // Add lights
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      sceneData.lighting.ambient_intensity
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      sceneData.lighting.directional_intensity
    );
    directionalLight.position.set(
      sceneData.lighting.directional_position.x,
      sceneData.lighting.directional_position.y,
      sceneData.lighting.directional_position.z
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    // Add fill light
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Add grid if visible
    if (sceneData.environment.grid_visible) {
      const gridHelper = new THREE.GridHelper(
        sceneData.environment.grid_size,
        sceneData.environment.grid_size,
        0x444444,
        0x333333
      );
      gridHelper.position.y = 0;
      scene.add(gridHelper);
    }

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // Store refs
    refs.current.renderer = renderer;
    refs.current.scene = scene;
    refs.current.camera = camera;
    refs.current.controls = controls;

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj.parent && !obj.userData.objectId) {
          obj = obj.parent;
        }
        if (obj.userData.objectId) {
          onObjectSelect(obj.userData.objectId);
          return;
        }
      }
      onObjectSelect(null);
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let time = 0;
    const animate = () => {
      refs.current.animationId = requestAnimationFrame(animate);
      time += 0.016;

      // Update controls
      controls.update();

      // Animate objects marked for animation
      refs.current.objects.forEach((obj) => {
        if (obj.userData.animating) {
          if (obj.userData.objectType === 'conveyor') {
            // Animate conveyor belt texture
            const belt = obj.getObjectByName('belt');
            if (belt && belt instanceof THREE.Mesh) {
              const material = belt.material as THREE.MeshStandardMaterial;
              if (material.map) {
                material.map.offset.x += 0.01;
              }
            }
          } else if (obj.userData.objectType === 'robot_arm') {
            // Animate robot arm
            const arm = obj.getObjectByName('upperArm');
            if (arm) {
              arm.rotation.z = Math.sin(time * 2) * 0.3;
            }
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      if (refs.current.animationId) {
        cancelAnimationFrame(refs.current.animationId);
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Create object geometry based on type
  const createObjectGeometry = useCallback((sceneObj: SceneObject): THREE.Object3D => {
    const group = new THREE.Group();
    group.userData.objectId = sceneObj.id;
    group.userData.objectType = sceneObj.type;
    group.userData.animating = sceneObj.animating || false;

    const color = new THREE.Color(sceneObj.color);

    switch (sceneObj.type) {
      case 'conveyor': {
        // Create conveyor belt
        const baseGeom = new THREE.BoxGeometry(10, 0.3, 2);
        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.8,
          metalness: 0.3,
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Belt surface
        const beltGeom = new THREE.BoxGeometry(9.8, 0.1, 1.8);
        const beltMat = new THREE.MeshStandardMaterial({
          color: 0x222222,
          roughness: 0.6,
          metalness: 0.2,
        });
        const belt = new THREE.Mesh(beltGeom, beltMat);
        belt.name = 'belt';
        belt.position.y = 0.35;
        group.add(belt);

        // Side rails
        const railGeom = new THREE.BoxGeometry(10, 0.4, 0.1);
        const railMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.4,
          metalness: 0.6,
        });

        const leftRail = new THREE.Mesh(railGeom, railMat);
        leftRail.position.set(0, 0.5, 1);
        leftRail.castShadow = true;
        group.add(leftRail);

        const rightRail = new THREE.Mesh(railGeom, railMat);
        rightRail.position.set(0, 0.5, -1);
        rightRail.castShadow = true;
        group.add(rightRail);

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
        const legMat = new THREE.MeshStandardMaterial({
          color: 0x444444,
          roughness: 0.5,
          metalness: 0.5,
        });

        const legPositions = [
          [-4, 0, 0.8],
          [-4, 0, -0.8],
          [4, 0, 0.8],
          [4, 0, -0.8],
        ];

        legPositions.forEach(([x, y, z]) => {
          const leg = new THREE.Mesh(legGeom, legMat);
          leg.position.set(x, y - 0.25, z);
          leg.castShadow = true;
          group.add(leg);
        });
        break;
      }

      case 'robot_arm': {
        // Base platform
        const baseGeom = new THREE.CylinderGeometry(0.8, 1, 0.3, 32);
        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.5,
          metalness: 0.7,
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Lower arm section
        const lowerArmGeom = new THREE.BoxGeometry(0.4, 2, 0.4);
        const armMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.4,
          metalness: 0.6,
        });
        const lowerArm = new THREE.Mesh(lowerArmGeom, armMat);
        lowerArm.position.y = 1.3;
        lowerArm.castShadow = true;
        group.add(lowerArm);

        // Joint
        const jointGeom = new THREE.SphereGeometry(0.3, 16, 16);
        const jointMat = new THREE.MeshStandardMaterial({
          color: 0x222222,
          roughness: 0.3,
          metalness: 0.8,
        });
        const joint = new THREE.Mesh(jointGeom, jointMat);
        joint.position.y = 2.3;
        joint.castShadow = true;
        group.add(joint);

        // Upper arm (animated part)
        const upperArmGroup = new THREE.Group();
        upperArmGroup.name = 'upperArm';
        upperArmGroup.position.y = 2.3;

        const upperArmGeom = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        const upperArm = new THREE.Mesh(upperArmGeom, armMat);
        upperArm.position.set(0.5, 0.5, 0);
        upperArm.rotation.z = -0.5;
        upperArm.castShadow = true;
        upperArmGroup.add(upperArm);

        // End effector
        const effectorGeom = new THREE.BoxGeometry(0.5, 0.2, 0.4);
        const effectorMat = new THREE.MeshStandardMaterial({
          color: 0x444444,
          roughness: 0.3,
          metalness: 0.8,
        });
        const effector = new THREE.Mesh(effectorGeom, effectorMat);
        effector.position.set(1.2, 0.8, 0);
        effector.castShadow = true;
        upperArmGroup.add(effector);

        group.add(upperArmGroup);
        break;
      }

      case 'box': {
        const boxGeom = new THREE.BoxGeometry(1, 1, 1);
        const boxMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.6,
          metalness: 0.2,
        });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.position.y = 0.5;
        box.castShadow = true;
        box.receiveShadow = true;
        group.add(box);
        break;
      }

      case 'safety_zone': {
        const zoneGeom = new THREE.PlaneGeometry(1, 1);
        const zoneMat = new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          emissive: color,
          emissiveIntensity: 0.3,
        });
        const zone = new THREE.Mesh(zoneGeom, zoneMat);
        zone.rotation.x = -Math.PI / 2;
        zone.position.y = 0.01;
        group.add(zone);

        // Add pulsing border
        const borderGeom = new THREE.EdgesGeometry(
          new THREE.BoxGeometry(1, 0.02, 1)
        );
        const borderMat = new THREE.LineBasicMaterial({
          color: color,
          linewidth: 2,
        });
        const border = new THREE.LineSegments(borderGeom, borderMat);
        border.position.y = 0.01;
        group.add(border);
        break;
      }

      case 'cylinder': {
        const cylGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
        const cylMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.5,
          metalness: 0.5,
        });
        const cyl = new THREE.Mesh(cylGeom, cylMat);
        cyl.position.y = 1;
        cyl.castShadow = true;
        cyl.receiveShadow = true;
        group.add(cyl);
        break;
      }

      case 'sphere': {
        const sphereGeom = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.4,
          metalness: 0.3,
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.y = 0.5;
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        group.add(sphere);
        break;
      }

      default: {
        // Default box for unknown types
        const defaultGeom = new THREE.BoxGeometry(1, 1, 1);
        const defaultMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.5,
          metalness: 0.3,
        });
        const defaultMesh = new THREE.Mesh(defaultGeom, defaultMat);
        defaultMesh.position.y = 0.5;
        defaultMesh.castShadow = true;
        group.add(defaultMesh);
      }
    }

    // Apply transforms
    group.position.set(
      sceneObj.position.x,
      sceneObj.position.y,
      sceneObj.position.z
    );
    group.rotation.set(
      THREE.MathUtils.degToRad(sceneObj.rotation.x),
      THREE.MathUtils.degToRad(sceneObj.rotation.y),
      THREE.MathUtils.degToRad(sceneObj.rotation.z)
    );
    group.scale.set(sceneObj.scale.x, sceneObj.scale.y, sceneObj.scale.z);
    group.visible = sceneObj.visible;

    // Add highlight effect if needed
    if (sceneObj.highlighted) {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissive = new THREE.Color(0xffff00);
          material.emissiveIntensity = 0.5;
        }
      });
    }

    return group;
  }, []);

  // Update scene objects when sceneData changes
  useEffect(() => {
    const { scene, objects } = refs.current;
    if (!scene) return;

    // Track which objects should exist
    const currentIds = new Set(sceneData.objects.map((obj) => obj.id));

    // Remove objects that no longer exist
    objects.forEach((threeObj, id) => {
      if (!currentIds.has(id)) {
        scene.remove(threeObj);
        objects.delete(id);
      }
    });

    // Add or update objects
    sceneData.objects.forEach((sceneObj) => {
      const existingObj = objects.get(sceneObj.id);

      if (existingObj) {
        // Update existing object
        existingObj.position.set(
          sceneObj.position.x,
          sceneObj.position.y,
          sceneObj.position.z
        );
        existingObj.rotation.set(
          THREE.MathUtils.degToRad(sceneObj.rotation.x),
          THREE.MathUtils.degToRad(sceneObj.rotation.y),
          THREE.MathUtils.degToRad(sceneObj.rotation.z)
        );
        existingObj.scale.set(
          sceneObj.scale.x,
          sceneObj.scale.y,
          sceneObj.scale.z
        );
        existingObj.visible = sceneObj.visible;
        existingObj.userData.animating = sceneObj.animating || false;

        // Update color
        existingObj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            if (material.color && child.name !== 'belt' && child.name !== 'ground') {
              material.color.set(sceneObj.color);
            }
            // Handle highlight
            if (sceneObj.highlighted) {
              material.emissive = new THREE.Color(0xffff00);
              material.emissiveIntensity = 0.5;
            } else {
              material.emissive = new THREE.Color(0x000000);
              material.emissiveIntensity = 0;
            }
          }
        });
      } else {
        // Create new object
        const newObj = createObjectGeometry(sceneObj);
        scene.add(newObj);
        objects.set(sceneObj.id, newObj);
      }
    });
  }, [sceneData.objects, createObjectGeometry]);

  // Handle camera transitions
  useEffect(() => {
    if (!cameraTransition?.active || !refs.current.controls || !refs.current.camera) {
      return;
    }

    const { camera, controls } = refs.current;
    const { targetPosition, targetLookAt } = cameraTransition;

    if (targetPosition) {
      // Animate camera position
      const startPos = camera.position.clone();
      const endPos = new THREE.Vector3(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z
      );

      let progress = 0;
      const duration = 1000;
      const startTime = Date.now();

      const animateCamera = () => {
        progress = Math.min((Date.now() - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        camera.position.lerpVectors(startPos, endPos, eased);

        if (targetLookAt) {
          controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
        }

        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      };

      animateCamera();
    }
  }, [cameraTransition]);

  return refs;
}
