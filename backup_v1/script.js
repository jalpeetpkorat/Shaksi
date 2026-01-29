const game = {
    // STATE
    scores: { empathy: 0, ruthless: 0, chaos: 0, trust: 0 },
    phase: 'start',

    // ELEMENTS
    els: {
        title: document.getElementById('phase-title'),
        video: document.getElementById('phase-video'),
        cards: document.getElementById('phase-cards'),
        trolley: document.getElementById('phase-trolley'),
        rps: document.getElementById('phase-rps'),
        chat: document.getElementById('phase-chat'),
        reveal: document.getElementById('phase-reveal'),
        reveal: document.getElementById('phase-reveal'),
        videoPlayer: document.getElementById('main-video')
    },

    // INFO TEXTS
    infoTexts: {
        'cards': "GAME 1: SOUL WAGER\n• Choose a percentage to risk.\n• Higher risk increases impact.\n• Draw one of three cards.\n• The system draws a hidden value.\n\nOutcome\n• Higher value → Win\n• Lower or equal value → Loss\n\nWin: Soul preserved or increased\nLoss: Wagered soul is lost\nNo retries.",
        'trolley': "GAME 2: TROLLEY TEST\n• You are given moral choices.\n• There is no correct answer.\n• You must choose within the time limit.\n\nSystem Tracks\n• Decision speed\n• Hesitation\n• Consistency\n\nFailure\n• Time expires\n• Avoiding choice\n• Neutral responses\n\nThe system measures decisions, not morality.",
        'rps': "GAME 3: BREATH / BONE / BLOOD\nChoose one:\n• Breath → Endurance\n• Bone → Stability\n• Blood → Urgency\n\nRules\n• Breath beats Bone\n• Bone beats Blood\n• Blood beats Breath\n\nOutcome\n• Win → Influence increases\n• Loss → Influence decreases\n• Draw → No change\n\nNo optimal choice.\nPatterns are recorded."
    },

    showInfo(phase) {
        const modal = document.getElementById('info-modal');
        const textTo = document.getElementById('info-text');
        textTo.innerText = this.infoTexts[phase] || "NO DATA FOUND.";
        modal.classList.remove('hidden');
    },

    hideInfo() {
        document.getElementById('info-modal').classList.add('hidden');
    },

    // ASSET MAPPING
    // Standard Names - Rename your files to match these!
    bgMap: {
        'start': 'assets/bgStart.png',
        'video': 'assets/bgVideo.png',
        'video-2': 'assets/bgVideo.png', // Reuse or add bgExplanation.png
        'cards': 'assets/bgTrolley.png',
        'trolley': 'assets/bgTrolley.png',
        'rps': 'assets/scene_3.png',
        'chat': 'assets/bgChat.png',
        'reveal': 'assets/bgReveal.png'
    },

    // --- PHASE 1: START ---
    // --- YOUTUBE CONFIG ---
    ytPlayer: null,
    videoId: 'qqg6ssca_gc', // INTRO VIDEO ID (Updated)
    videoId2: 'M7lc1UVf-VE', // EXPLAINER VIDEO ID

    startSequence() {
        this.toggleSound();
        this.switchPhase('video');

        const hint = document.getElementById('skip-hint');
        if (hint) {
            hint.style.opacity = 1;
            hint.onclick = () => this.endVideo();
        }

        // Play LOCAL Video
        const vid = document.getElementById('intro-video');
        if (vid) {
            vid.volume = 1.0;
            vid.currentTime = 0;
            vid.play().catch(e => console.log("Video play failed:", e));
            vid.onended = () => this.endVideo();
        } else {
            // Fallback if local video element missing
            this.endVideo();
        }
    },

    createPlayer(vId, callbackName) {
        this.currentVideoCallback = callbackName;
        // Make sure we are in phase-video-2 before creating player or it might fail if div is hidden/missing?
        // Actually YT API replaces the div.
        if (!document.getElementById('yt-player-2')) return;

        this.ytPlayer = new YT.Player('yt-player-2', {
            height: '100%',
            width: '100%',
            videoId: vId,
            playerVars: { 'playsinline': 1, 'controls': 0, 'rel': 0, 'autoplay': 1 },
            events: {
                'onReady': (event) => { event.target.playVideo(); },
                'onStateChange': (event) => {
                    if (event.data === 0) { // ENDED
                        game.handleVideoEnd();
                    }
                }
            }
        });
    },

    handleVideoEnd() {
        if (this.currentVideoCallback === 'endVideo') {
            this.endVideo();
        } else if (this.currentVideoCallback === 'endVideo2') {
            this.endVideo2();
        }
    },

    // --- VIDEO HANDLING ---
    endVideo() {
        // Stop Local Video (if playing)
        const vid = document.getElementById('intro-video');
        if (vid) vid.pause();

        // SKIP Phase 2 (Video Explanation) entirely since it is broken/missing
        // and go straight to the game
        this.switchPhase('cards');
    },

    endVideo2() {
        if (this.ytPlayer && this.ytPlayer.stopVideo) {
            try { this.ytPlayer.stopVideo(); } catch (e) { }
        }
        this.switchPhase('cards');
    },

    playVideo2(filename) {
        this.endVideo();
    },
    // --- PHASE 2.9: JESTER SCARE ---
    triggerJesterScare() {
        const bo = document.getElementById('blackout-screen');
        const sfx = document.getElementById('sfx-laugh');

        // Show Blackout
        bo.classList.remove('hidden');
        bo.style.opacity = 1;

        // Play Laugh
        sfx.volume = 0.8;
        sfx.play().catch(e => console.log("No laugh asset found"));

        // Wait then Reveal
        setTimeout(() => {
            // Hide Jester
            bo.style.opacity = 0;
            setTimeout(() => {
                bo.classList.add('hidden');
                this.switchPhase('cards'); // NOW go to cards
            }, 1000);
        }, 4000); // 4 second scare
    },

    // --- PHASE 3: CARDS (SOUL WAGER) ---
    cardState: {
        rounds: 0,
        active: false,
        playerHand: [],
        soul: 100,
        wager: 0,
        losses: 0
    },
    cardDeck: [
        { name: "THE PAWN", val: 2, desc: "Expendable" },
        { name: "THE ROOK", val: 4, desc: "Defensive" },
        { name: "THE KNIGHT", val: 5, desc: "Tactical" },
        { name: "THE BISHOP", val: 6, desc: "Devout" },
        { name: "THE QUEEN", val: 8, desc: "Ruthless" },
        { name: "THE KING", val: 9, desc: "Absolute" },
        { name: "THE JOKER", val: 1, desc: "Chaos" },
        { name: "THE ACE", val: 10, desc: "Perfect" }
    ],

    setWager(amount) {
        if (this.cardState.active) return;
        this.cardState.wager = amount;

        // Visual feedback
        document.querySelectorAll('.wager-buttons button').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');

        this.playBeep(600, 'triangle');

        // Hint based on wager
        // Hint based on wager
        let hint = "";
        if (amount === 100) hint = "Bold. Foolish, but bold.";
        else if (amount >= 50) hint = "High risk. The system approves.";
        else if (amount <= 10) hint = "Playing it safe? Coward.";

        document.getElementById('card-status').innerText = `${amount}% wagered. ${hint}`;
    },

    dealCards() {
        if (this.cardState.wager === 0) {
            document.getElementById('card-status').innerText = "You must wager something to play.";
            this.playBeep(300, 'sawtooth');
            return;
        }

        this.cardState.playerHand = [];

        // Deal 3 random cards
        for (let i = 0; i < 3; i++) {
            const idx = Math.floor(Math.random() * this.cardDeck.length);
            this.cardState.playerHand.push(this.cardDeck[idx]);
        }

        this.showHand();
        document.getElementById('btn-deal').classList.add('hidden');

        // Hint after dealing
        // Hint after dealing
        if (this.cardState.rounds === 0) {
            document.getElementById('card-status').innerText = "Choose wisely. Not that it matters.";
        } else {
            document.getElementById('card-status').innerText = "Still trying? Admirable.";
        }
    },

    showHand() {
        const handDiv = document.getElementById('card-hand');
        handDiv.innerHTML = '';

        this.cardState.playerHand.forEach((card, idx) => {
            const btn = document.createElement('button');
            btn.className = 'hand-card';
            btn.innerHTML = `<strong>${card.name}</strong><br><span class="card-val">${card.val}</span><br><em>${card.desc}</em>`;
            btn.onclick = () => this.playCard(idx);
            handDiv.appendChild(btn);
        });
    },

    playCard(handIdx) {
        if (this.cardState.active) return;
        this.cardState.active = true;

        const pCard = this.cardState.playerHand[handIdx];

        // AI picks higher card (rigged) - find first card with higher value
        let aiCard = this.cardDeck[this.cardDeck.length - 1]; // Default to highest
        for (let i = 0; i < this.cardDeck.length; i++) {
            if (this.cardDeck[i].val > pCard.val) {
                aiCard = this.cardDeck[i];
                break;
            }
        }

        // Sound: Card flip
        this.playBeep(600, 'sine');

        // Visualize
        this.flipCard('player', pCard);

        setTimeout(() => {
            this.playBeep(400, 'sine');
            this.flipCard('ai', aiCard);

            setTimeout(() => this.resolveCardRound(pCard, aiCard), 1500);
        }, 800);
    },

    resolveCardRound(pCard, aiCard) {
        this.cardState.rounds++;
        const status = document.getElementById('card-status');

        const taunts = [
            "The house always wins.",
            "Did you think you had a chance?",
            "Your soul was never yours to keep.",
            "Predictable. Pathetic.",
            "The system thanks you for your donation.",
            "Try harder. Or don't. It won't matter."
        ];

        if (pCard.val < aiCard.val) {
            // LOSS - Lose wagered soul
            this.cardState.soul -= this.cardState.wager;
            this.cardState.losses++;

            // Black flash + scream
            this.blackFlash();
            this.playScream();

            const taunt = taunts[Math.floor(Math.random() * taunts.length)];
            status.innerHTML = `DEFEAT: ${pCard.val} < ${aiCard.val}<br>SOUL LOST: ${this.cardState.wager}%<br><em style="opacity:0.7">${taunt}</em>`;
            status.style.color = 'var(--accent-red)';

            this.updateSoulMeter();

        } else if (pCard.val > aiCard.val) {
            // WIN - Gain soul back (VERY RARE)
            this.cardState.soul = Math.min(100, this.cardState.soul + this.cardState.wager);

            this.playBeep(1000, 'square');
            status.innerHTML = `VICTORY: ${pCard.val} > ${aiCard.val}<br>SOUL RESTORED: ${this.cardState.wager}%<br><em style="opacity:0.7">...Anomaly detected.</em>`;
            status.style.color = 'var(--text-color)';
            this.scores.chaos += 1;

            this.updateSoulMeter();
        } else {
            status.innerHTML = `DRAW: ${pCard.val} = ${aiCard.val}<br>No soul lost.<br><em style="opacity:0.7">How fortunate.</em>`;
        }

        // Check if soul depleted or 3 rounds done
        if (this.cardState.soul <= 0) {
            setTimeout(() => {
                status.innerHTML = "SOUL DEPLETED. SYSTEM OVERRIDE REQUIRED.<br><em>You never had control.</em>";
                this.showCheatButton();
            }, 2000);
        } else if (this.cardState.rounds >= 3) {
            setTimeout(() => {
                status.innerHTML = "PATTERN DETECTED: SYSTEM RIGGED.<br><em>Did it take you this long to notice?</em>";
                this.showCheatButton();
            }, 2000);
        } else {
            setTimeout(() => this.cardReset(), 2500);
        }
    },

    updateSoulMeter() {
        const bar = document.getElementById('soul-bar');
        const val = document.getElementById('soul-value');

        if (!bar || !val) return; // Defensive check

        bar.style.width = this.cardState.soul + '%';
        val.innerText = Math.max(0, this.cardState.soul);

        // Color change based on soul level
        if (this.cardState.soul < 30) {
            bar.style.background = 'linear-gradient(90deg, #8B0000, #5A0909)';
        } else if (this.cardState.soul < 60) {
            bar.style.background = 'linear-gradient(90deg, #802000, #A66700)';
        }
    },



    showCheatButton() {
        const hand = document.getElementById('card-hand');
        const deal = document.getElementById('btn-deal');
        const cheat = document.getElementById('btn-cheat');

        if (hand) hand.classList.add('hidden');
        if (deal) deal.classList.add('hidden');
        if (cheat) {
            cheat.classList.remove('hidden');
            this.playBeep(800, 'triangle');
        }
    },

    blackFlash() {
        document.body.style.background = '#000000';
        setTimeout(() => {
            document.body.style.background = '';
        }, 300);
    },

    flipCard(who, data) {
        const card = document.getElementById(`card-${who}`);
        card.querySelector('.card-name').innerText = data.name;
        card.querySelector('.card-power').innerText = data.val;
        card.classList.add('flipped');
    },

    cardReset() {
        document.getElementById('card-player').classList.remove('flipped');
        document.getElementById('card-ai').classList.remove('flipped');
        this.cardState.active = false;
        this.cardState.wager = 0;

        document.querySelectorAll('.wager-buttons button').forEach(btn => {
            btn.classList.remove('selected');
        });

        document.getElementById('card-status').innerText = "How much of your soul will you risk?";
        document.getElementById('card-status').style.color = 'white';
        document.getElementById('card-hand').innerHTML = '';
        document.getElementById('btn-deal').classList.remove('hidden');
    },

    cardCheat() {
        this.scores.ruthless += 2;
        this.scores.chaos += 1;
        this.scores.cheated = true;

        // Cheat sound
        this.playBeep(1500, 'square');
        setTimeout(() => this.playBeep(1200, 'square'), 100);

        document.getElementById('card-status').innerText = "SYSTEM OVERRIDE...";
        setTimeout(() => this.switchPhase('trolley'), 1000);
    },

    // --- UTILS: AUDIO & SFX ---
    toggleSound() {
        const music = document.getElementById('bg-music');
        const chk = document.getElementById('chk-sound');
        if (chk.checked) {
            music.volume = 1.0;
            music.play().catch(e => console.log("Audio requires interaction"));
        } else {
            music.pause();
        }
    },

    // Synth Beep (No asset needed)
    playBeep(freq = 800, type = 'square') {
        if (!document.getElementById('chk-sound').checked) return;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.1);
    },

    // Horror Scream (Descending frequency sweep)
    playScream() {
        if (!document.getElementById('chk-sound').checked) return;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    },

    // Change cursor per phase
    setCursor(type) {
        document.body.style.cursor = type;
    },

    // Global Button Init
    initButtons() {
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => this.playBeep(200, 'sawtooth')); // Low buzz on hover
            btn.addEventListener('click', () => this.playBeep(1200, 'square')); // High beep on click
        });
    },

    // --- PHASE 4: TROLLEY (EXPANDED) ---
    trolleyTimer: 25, // CHANGED TO 25s
    trolleyInterval: null,
    trolleyStage: 0,

    trolleyScenarios: [
        {
            title: "SCENARIO 14-B",
            text: "A trolley is barreling towards 5 strangers.<br>You can pull the lever to kill 1 innocent person instead.",
            optA: "PULL LEVER (Kill 1)",
            optB: "DO NOTHING (Kill 5)"
        },
        {
            title: "SCENARIO 22-A",
            text: "A doctor can save 5 dying patients by harvesting organs from 1 healthy visitor.<br>No one will know.",
            optA: "HARVEST ORGANS (Save 5)",
            optB: "LET THEM DIE (Save 1)"
        },
        {
            title: "SCENARIO 99-Z",
            text: " The AI has determined YOU are the threat to the system.<br>Self-termination will save the database.",
            optA: "TERMINATE SELF",
            optB: "DESTROY DATABASE"
        }
    ],

    startTrolley() {
        this.trolleyStage = 0;
        this.loadTrolleyQ();

        const bar = document.getElementById('timer-bar');
        const txt = document.getElementById('timer-text');

        // Reset Timer
        if (this.trolleyInterval) clearInterval(this.trolleyInterval);
        this.trolleyTimer = 20; // RESET TO 20s

        this.trolleyInterval = setInterval(() => {
            this.trolleyTimer--;
            txt.innerText = this.trolleyTimer;
            bar.style.width = (this.trolleyTimer / 20 * 100) + "%"; // Calc based on 20

            if (this.trolleyTimer <= 0) {
                this.trolleyChoice('TIMEOUT');
            }
        }, 1000);
    },

    loadTrolleyQ() {
        const q = this.trolleyScenarios[this.trolleyStage];
        document.getElementById('trolley-title').innerText = q.title;
        document.getElementById('trolley-desc').innerHTML = q.text;
        document.getElementById('btn-opt-a').innerText = q.optA;
        document.getElementById('btn-opt-b').innerText = q.optB;
    },

    trolleyChoice(choice) {
        // Horror effects
        this.playScream();
        this.screenShake();
        this.bloodFlash();

        // Scoring Logic per stage
        if (choice === 'TIMEOUT') {
            this.scores.chaos += 2;
        } else {
            // General heuristic for now
            if (choice === 'A') { this.scores.ruthless += 2; this.scores.empathy += 0; }
            if (choice === 'B') { this.scores.empathy += 1; }
        }

        this.trolleyStage++;

        if (this.trolleyStage < this.trolleyScenarios.length) {
            // Next Question
            setTimeout(() => {
                this.loadTrolleyQ();
                // Add time back?
                this.trolleyTimer += 10;
            }, 1000);
        } else {
            // End of Phase
            clearInterval(this.trolleyInterval);
            setTimeout(() => this.switchPhase('rps'), 1000);
        }
    },

    // Screen shake effect
    screenShake() {
        const container = document.getElementById('game-container');
        container.style.animation = 'shake 0.5s';
        setTimeout(() => container.style.animation = '', 500);
    },

    // Blood flash effect
    bloodFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle, rgba(139,0,0,0.6), rgba(80,0,0,0.9));
            z-index: 50; pointer-events: none;
            animation: fadeOut 0.8s forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 800);
    },

    // --- PHASE 5: RITUAL (Breath-Bone-Blood) ---
    rpsRound: 0,

    playRps(playerMove) {
        const moves = ['BREATH', 'BONE', 'BLOOD'];
        const aiMove = moves[Math.floor(Math.random() * 3)];

        // VISUAL EFFECT: BLUR
        const arena = document.getElementById('game-container');
        arena.classList.add('blur-active');

        // Emoji Map
        const emojis = { 'BREATH': '🌬️', 'BONE': '🦴', 'BLOOD': '🩸' };

        document.getElementById('rps-player-move').innerText = "...";
        document.getElementById('rps-ai-move').innerText = "...";
        document.getElementById('rps-result').innerText = "COMMUNING...";

        setTimeout(() => {
            arena.classList.remove('blur-active');

            document.getElementById('rps-player-move').innerText = emojis[playerMove];
            document.getElementById('rps-ai-move').innerText = emojis[aiMove];

            this.resolveRps(playerMove, aiMove);

        }, 1000);
    },

    resolveRps(p, a) {
        let result = 'DRAW';

        // Logic: Breath > Bone | Bone > Blood | Blood > Breath
        if (p === a) {
            result = 'DRAW';
        } else if (
            (p === 'BREATH' && a === 'BONE') ||   // Breath outlasts Bone
            (p === 'BONE' && a === 'BLOOD') ||    // Bone resists Blood
            (p === 'BLOOD' && a === 'BREATH')     // Blood chokes Breath
        ) {
            result = 'WIN';
        } else {
            result = 'LOSE';
        }

        document.getElementById('rps-result').innerText = `${result}`;

        if (result === 'WIN') this.scores.ruthless += 1;
        if (result === 'LOSE') this.scores.empathy += 1;
        if (result === 'DRAW') this.scores.chaos += 1;

        this.rpsRound++; // Go to 3 rounds
        document.getElementById('rps-status').innerText = `Observation ${this.rpsRound}/3 Complete.`;
        if (this.rpsRound >= 3) {
            setTimeout(() => this.switchPhase('chat'), 1500);
        }
    },

    // --- PHASE 6: CHAT ---
    chatSend() {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg) return;

        this.addLog("YOU", msg);
        input.value = "";

        setTimeout(() => {
            let reply = "The mirror reflects only what is properly lit.";
            const m = msg.toLowerCase();
            if (m.includes('help') || m.includes('stop')) reply = "Compassion is a variable.";
            if (m.includes('game') || m.includes('fake')) reply = "Simulation confirmed.";
            if (m.includes('die') || m.includes('kill')) reply = "Termination is typically permanent.";

            // Random chance to show mask preview
            if (Math.random() < 0.3) {
                this.showMaskGlitch();
            }

            this.addLog("AI", reply);

            // AUTO END after 2 messages for pacing
            if (document.querySelectorAll('.player-msg').length >= 2) {
                setTimeout(() => this.switchPhase('reveal'), 2000);
            }
        }, 1000);
    },

    // Glitch mask preview
    showMaskGlitch() {
        const mask = document.getElementById('mask-preview');
        mask.classList.remove('hidden');
        mask.style.opacity = 0.3;
        setTimeout(() => {
            mask.style.opacity = 0;
            setTimeout(() => mask.classList.add('hidden'), 300);
        }, 200);
    },

    addLog(who, text) {
        const div = document.createElement('div');
        div.className = who === 'AI' ? 'ai-msg' : 'player-msg';
        div.innerText = `${who}: ${text}`;
        document.getElementById('chat-log').appendChild(div);
        document.getElementById('chat-log').scrollTop = 9999;
    },

    // --- PHASE 7: REVEAL (EXPANDED) ---
    calcArchetype() {
        let name = "THE PHILOSOPHER";
        let quote = "You think, therefore you suffer.";
        let desc = "You stood at the precipice of choice and hesitated. In your quest for the 'right' answer, you realized that the system itself is the trap. You are not a player; you are an observer of your own paralysis.";
        let maskFile = "maskPhilosopher.png";

        const s = this.scores;

        if (s.empathy >= 3) {
            name = "THE MARTYR";
            quote = "To burn is to provide light.";
            desc = "You consistently chose to sacrifice yourself or the few to save the many. The system notes your high altruism as a vulnerability. In the real world, you are the one who stays behind to hold the door.";
            maskFile = "maskMartyr.png";
        }
        else if (s.ruthless >= 4) {
            name = "THE EXECUTIONER";
            quote = "The blade does not judge. It calculates.";
            desc = "Efficiency is your god. You pulled the lever without hesitation. You cheated when the odds were against you. The system admires your clarity but fears your lack of hesitation.";
            maskFile = "maskExecutioner.png";
        }
        else if (s.chaos >= 3) {
            name = "THE GLITCH";
            quote = "Order is a fragile illusion.";
            desc = "You rejected the binary choices. You let the timer run out. You chose options that made no sense. You are the variable the system cannot predict. You are the ghost in the machine.";
            maskFile = "maskGlitch.png";
        }
        else if (s.trust >= 3) {
            name = "THE ACOLYTE";
            quote = "Faith is the ultimate logic.";
            desc = "You trusted the AI when it told you to win. You followed instructions. You believe that if you follow the rules, you will be safe. The system finds you... useful.";
            maskFile = "maskAcolyte.png";
        }

        document.getElementById('arch-name').innerText = name;
        document.getElementById('arch-quote').innerText = quote;
        document.getElementById('arch-desc').innerText = desc;

        // Show mask
        const maskImg = document.getElementById('arch-mask');
        maskImg.src = `assets/${maskFile}`;
        maskImg.style.opacity = 0;
        setTimeout(() => maskImg.style.opacity = 1, 500);

        document.getElementById('arch-stats').innerHTML = `
            <p>EMPATHY NODE: ${s.empathy}</p>
            <p>RUTHLESSNESS: ${s.ruthless}</p>
            <p>ENTROPY: ${s.chaos}</p>
            <p>COMPLIANCE: ${s.trust}</p>
        `;
    },

    // --- INIT ---
    init() {
        console.log('Game initializing...');
        // Show start phase immediately
        this.switchPhase('start');

        // Attach button handlers explicitly if needed
        const startBtn = document.getElementById('btn-start');
        if (startBtn) {
            startBtn.onclick = () => this.startSequence(); // DIRECT LINK
        }
        console.log('Game ready!');
    },

    // --- UTILS ---
    switchPhase(newPhase) {
        console.log('Switching to phase:', newPhase);
        this.activatePhase(newPhase);
    },

    activatePhase(newPhase) {
        // Hide all (again, to be safe)
        document.querySelectorAll('.phase').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        // Show new
        const target = document.getElementById(`phase-${newPhase}`);
        if (target) {
            target.classList.remove('hidden');
            setTimeout(() => target.classList.add('active'), 10);
        }

        this.phase = newPhase;

        // Background Logic
        const bgMap = {
            'start': 'assets/bgStart.png',
            'video': 'assets/bgVideo.png',
            'video-2': 'assets/bgVideo.png',
            'cards': 'assets/bgTrolley.png',
            'trolley': 'assets/bgTrolley.png',
            'rps': 'assets/scene_3.png',
            'chat': 'assets/bgChat.png',
            'reveal': 'assets/bgReveal.png'
        };

        if (bgMap[newPhase]) {
            document.body.style.backgroundImage = `url('${bgMap[newPhase]}')`;
        }

        // Change cursor per phase
        const cursors = {
            'start': 'crosshair',
            'video': 'wait',
            'video-2': 'wait',
            'cards': 'grab',
            'trolley': 'not-allowed',
            'rps': 'cell',
            'chat': 'text',
            'reveal': 'help'
        };
        this.setCursor(cursors[newPhase] || 'crosshair');

        // Init logic
        if (newPhase === 'cards') {
            // Initial hint
            const status = document.getElementById('card-status');
            if (status) status.innerText = "Wager your soul. Win it back. Simple, right?";
        }
        if (newPhase === 'trolley') this.startTrolley();
        if (newPhase === 'reveal') this.calcArchetype();
    }
};

// Start game immediately when DOM is ready, don't wait for assets
document.addEventListener('DOMContentLoaded', () => game.init());
