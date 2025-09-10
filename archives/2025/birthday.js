window.addEventListener('load', () => {
    // 所有资源加载完成后，等待3秒
    setTimeout(() => {
        // 3秒后，隐藏加载动画
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.add('hidden');

        // --- 定义所有元素和函数 ---
        const startOverlay = document.getElementById('start-overlay');
        const startButton = document.getElementById('start-button');
        const musicPlayer = document.getElementById('background-music');
        musicPlayer.src = 'onelastkiss.MP3';

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 6000);
        const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        scene.fog = new THREE.FogExp2(0x000000, 0.0007);

        const particlesCount = 50000;
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const color = new THREE.Color();
        const starfieldSize = 5000;
        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * starfieldSize;
            positions[i * 3 + 1] = (Math.random() - 0.5) * starfieldSize;
            positions[i * 3 + 2] = (Math.random() - 0.5) * starfieldSize;
            color.setHSL(0.75 + Math.random() * 0.1, 0.9, 0.6 + Math.random() * 0.2);
            colors[i * 3]     = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const particlesMaterial = new THREE.PointsMaterial({ size: 3.5, vertexColors: true, sizeAttenuation: true });
        const stars = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(stars);

        gsap.registerPlugin(ScrollTrigger);
        
        const introHey = document.getElementById('intro-hey');
        const introLinLeft = document.getElementById('intro-linlin-left');
        const introLinRight = document.getElementById('intro-linlin-right');
        gsap.set([introHey, introLinLeft, introLinRight], { opacity: 0 });

        // --- 把动画和交互逻辑绑定到按钮点击事件 ---
        startButton.addEventListener('click', () => {
            // 1. 隐藏开始界面
            startOverlay.classList.add('hidden');

            // 2. 播放音乐
            musicPlayer.play().catch(e => console.error("Music playback failed:", e));

            // 3. 开始执行所有动画
            const preScrollTl = gsap.timeline();
            preScrollTl.to("#special-unlocked", { opacity: 1, duration: 2, ease: "power2.out" })
                       .to("#scroll-prompt", { opacity: 1, duration: 1.5 }, "+=3");

            const masterTl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#scroll-container",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.5,
                }
            });

            masterTl.to(["#special-unlocked", "#scroll-prompt"], { opacity: 0, duration: 2 });
            masterTl.to(introHey, { opacity: 1, scale: 1, duration: 4 }, "<");
            masterTl.to(introLinLeft, { opacity: 1, x: '-55%', duration: 8, ease: 'power2.inOut' });
            masterTl.to(introLinRight, { opacity: 1, x: '55%', duration: 8, ease: 'power2.inOut' }, "<");
            masterTl.to(introHey, { opacity: 0, scale: 0.5, duration: 6, ease: 'power2.inOut' }, "<+1");
            masterTl.to("#intro-title-container", { opacity: 0, duration: 3 });
            masterTl.set("#intro-container", { display: "none" });

            const textSections = document.querySelectorAll('.text-section');
            const initialCameraZ = 400;
            camera.position.set(0, 0, initialCameraZ);

            textSections.forEach((section, index) => {
                const isLastSection = index === textSections.length - 1;
                const zMovement = 120;
                
                masterTl.to(camera.position, {
                    x: (Math.random() - 0.5) * 150,
                    y: (Math.random() - 0.5) * 100,
                    z: initialCameraZ - (index + 1) * zMovement,
                    duration: 10,
                    ease: "power1.inOut"
                }, `scene${index}`);
                masterTl.to(camera.rotation, {
                    x: `+=${(Math.random() - 0.5) * 0.4}`,
                    y: `+=${(Math.random() - 0.5) * 0.4}`,
                    duration: 10,
                    ease: "power1.inOut"
                }, `scene${index}`);

                if (section.classList.contains('chapter-heading')) {
                    masterTl.fromTo(section, 
                        { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
                        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 4, ease: 'power3.out' },
                        `scene${index}+=3`
                    );
                } else if (section.querySelector('.english-quote')) {
                    masterTl.fromTo(section, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 3 }, `scene${index}+=3`);
                    masterTl.from(section.querySelector('.english-quote'), { opacity: 0, scale: 0.7, duration: 4, ease: 'elastic.out(1, 0.7)' }, `scene${index}+=4`);
                } else {
                    masterTl.fromTo(section, 
                        { opacity: 0, y: 50 }, 
                        { opacity: 1, y: 0, duration: 4, ease: "power2.out" }, 
                        `scene${index}+=3`
                    );
                }

                if (!isLastSection) {
                    masterTl.to(section, { opacity: 0, scale: 0.95, duration: 3, ease: "power2.out" }, `scene${index}+=8`);
                }
            });

        }, { once: true }); // 事件只触发一次

        // --- 渲染与自适应 ---
        const animate = () => {
            stars.rotation.y += 0.0002;
            stars.rotation.z += 0.0002;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

    }, 3000); // 强制等待的3秒钟
});
