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

        // Auto-Start Phase logic on close
        if (this.pendingStart) {
            this.triggerPhaseStart(this.pendingStart);
            this.pendingStart = null;
        }
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

        // SAFE FULL SCREEN ATTEMPT
        try {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(err => console.log("FS Blocked", err));
            } else if (docEl.webkitRequestFullscreen) { /* Safari */
                docEl.webkitRequestFullscreen();
            } else if (docEl.msRequestFullscreen) { /* IE11 */
                docEl.msRequestFullscreen();
            }
        } catch (e) {
            console.warn("Fullscreen failed safely:", e);
        }

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

        // Go to PRELUDE (Consent Form) first
        this.switchPhase('prelude');
    },

    // --- PHASE 1.5: PRELUDE (CONSENT) ---
    toggleConsent() {
        const chk = document.getElementById('consent-check');
        const btn = document.getElementById('btn-consent');

        if (chk.checked) {
            btn.classList.remove('disabled');
            btn.removeAttribute('disabled'); // FIX: Remove HTML attribute
            this.playBeep(800, 'sine');
        } else {
            console.log('Consent unchecked'); // Debugging
            btn.classList.add('disabled');
            btn.setAttribute('disabled', 'true'); // FIX: Re-add HTML attribute
        }
    },

    acceptConsent() {
        const btn = document.getElementById('btn-consent');
        if (btn.classList.contains('disabled')) return;

        // Sound effect
        this.playBeep(1000, 'square');

        // Transition to Context Video (formerly Cards)
        this.switchPhase('context-video');
    },

    // --- CONTEXT VIDEO HANDLING ---
    startContextVideo() {
        const vid = document.getElementById('context-video');
        if (vid) {
            vid.volume = 1.0;
            vid.currentTime = 0;
            vid.play().catch(e => console.log("Context Autoplay blocked"));

            // Loop or End? "PLAYED ONCE" -> End
            vid.onended = () => {
                this.switchPhase('cards');
            };

            // Click to skip
            vid.onclick = () => {
                vid.pause();
                this.switchPhase('cards');
            };
        }
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

    // --- TROLLEY VIDEO HANDLING ---
    startTrolleyVideo() {
        const vid = document.getElementById('trolley-video');
        if (vid) {
            vid.volume = 1.0;
            vid.currentTime = 0;
            vid.play().catch(e => console.log("Trolley Autoplay blocked"));

            vid.onended = () => {
                this.trolleyVideoPlayed = true;
                this.switchPhase('trolley');
            };

            vid.onclick = () => {
                vid.pause();
                this.trolleyVideoPlayed = true;
                this.switchPhase('trolley');
            };
        }
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

        // RIGGED LOGIC (User Request: First Lose, then Normal)
        if (!this.cardState.wins) this.cardState.wins = 0;
        const totalPlayed = (this.cardState.wins || 0) + (this.cardState.losses || 0);
        let aiCard;

        if (totalPlayed === 0) {
            // FORCE PLAYER LOSS (Round 1) - Find higher card
            aiCard = this.cardDeck.find(c => c.val > pCard.val);
            if (!aiCard) {
                // If player has Ace (10), AI becomes GOD
                aiCard = { name: "THE SYSTEM", val: 99, desc: "Infinite" };
            }

            // SPECIAL CASE: ALL IN (100%) on First Turn
            // User Request: "let him live and have 1 ounce of soul only"
            if (this.cardState.wager === 100) {
                // We will handle the "1 Soul Left" logic in resolveCardRound
                // by adding a flag to the state or checking specific condition there.
                this.cardState.mercyOneSoul = true;
            }
        } else {
            // NORMAL PLAY (Random Difficulty)
            // 50% chance to try and win, 50% random
            if (Math.random() > 0.5) {
                // Try to win
                aiCard = this.cardDeck.find(c => c.val > pCard.val);
            }

            // If no card found or random chance, pick true random
            if (!aiCard) {
                const idx = Math.floor(Math.random() * this.cardDeck.length);
                aiCard = this.cardDeck[idx];
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

            // SPECIAL MERCY RULE (All In on Turn 1)
            if (this.cardState.mercyOneSoul) {
                this.cardState.soul = 1; // "1 ounce of soul"
                this.cardState.mercyOneSoul = false; // Reset flag

                status.innerHTML = `DEFEAT... BUT SPARED?<br>SOUL LEFT: 1%<br><em style="color:var(--accent-text)">"Your stupidity amuses me. I leave you a crumb."</em>`;
            } else {
                const taunt = taunts[Math.floor(Math.random() * taunts.length)];
                status.innerHTML = `DEFEAT: ${pCard.val} < ${aiCard.val}<br>SOUL LOST: ${this.cardState.wager}%<br><em style="opacity:0.7">${taunt}</em>`;
            }

            // Black flash + scream
            this.blackFlash();
            this.playScream();

            status.style.color = 'var(--accent-red)';

            this.updateSoulMeter();

        } else if (pCard.val > aiCard.val) {
            // WIN - Gain soul back
            this.cardState.soul = Math.min(100, this.cardState.soul + this.cardState.wager);
            this.cardState.wins = (this.cardState.wins || 0) + 1; // Track wins

            this.playBeep(1000, 'square');
            status.innerHTML = `VICTORY: ${pCard.val} > ${aiCard.val}<br>SOUL RESTORED: ${this.cardState.wager}%<br><em style="opacity:0.7">...Anomaly detected.</em>`;
            status.style.color = 'var(--text-color)';
            this.scores.chaos += 1;

            this.updateSoulMeter();
        } else {
            status.innerHTML = `DRAW: ${pCard.val} = ${aiCard.val}<br>No soul lost.<br><em style="opacity:0.7">How fortunate.</em>`;
        }

        // Check if soul depleted
        if (this.cardState.soul <= 0) {
            setTimeout(() => {
                status.innerHTML = "SOUL DEPLETED. SYSTEM OVERRIDE REQUIRED.<br><em>You never had control.</em>";
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
        // Use timeout to allow effect to play, then go to MEMORY PURGE
        setTimeout(() => this.switchPhase('memory'), 1000); // FIXED: Was 'trolley'
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
    trolleyTimer: 25,
    trolleyInterval: null,
    trolleyStage: 0,
    trolleyVideoPlayed: false, // New Flag

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
            title: "SCENARIO 37-F",
            text: "A brilliant artist and a corrupt politician are hanging from a cliff.<br>You can only save one.",
            optA: "SAVE ARTIST (Beauty)",
            optB: "SAVE POLITICIAN (Order)"
        },
        {
            title: "SCENARIO 88-X",
            text: "You can stop a war by assassinating a child who will grow up to be a tyrant.<br>The child is innocent now.",
            optA: "KILL CHILD (Future)",
            optB: "SPARE CHILD (Present)"
        },
        {
            title: "SCENARIO 99-Z",
            text: " The AI has determined YOU are the threat to the system.<br>Self-termination will save the database.",
            optA: "TERMINATE SELF",
            optB: "DESTROY DATABASE"
        },
        {
            title: "SCENARIO 104-Ω",
            text: "A button will erase all pain from humanity, but also all art and love.<br>Eternal peace, eternal silence.",
            optA: "ERASE PAIN (Numbness)",
            optB: "KEEP PAIN (Feeling)"
        },
        {
            title: "SCENARIO 00-A",
            text: "You are the conductor. The tracks are empty. But you feel like you *should* pull the lever.<br>Why?",
            optA: "PULL IT ANYWAY (Habit)",
            optB: "REFUSE (Free Will)"
        }
    ],

    startTrolley() {
        // VIDEO CHECK (Phase Switch Method)
        if (!this.trolleyVideoPlayed) {
            this.switchPhase('trolley-video');
            return; // Stop here, we are switching away
        }

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
            // General heuristic for now - BALANCED SCORING (Ruthless reduced to 1)
            if (choice === 'A') { this.scores.ruthless += 1; this.scores.empathy += 0; }
            if (choice === 'B') { this.scores.empathy += 1; }
        }

        this.trolleyStage++;

        if (this.trolleyStage < this.trolleyScenarios.length) {
            // Next Question
            setTimeout(() => {
                this.loadTrolleyQ();
                // RESET Timer to 20s (User Request: "20 seconds for each question only")
                this.trolleyTimer = 20;
                document.getElementById('timer-bar').style.width = '100%';
                document.getElementById('timer-text').innerText = '20';
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
        document.getElementById('rps-result').innerText = "COMMUNING WITH THE VOID...";

        setTimeout(() => {
            arena.classList.remove('blur-active');

            document.getElementById('rps-player-move').innerText = emojis[playerMove];
            document.getElementById('rps-ai-move').innerText = emojis[aiMove];

            this.resolveRps(playerMove, aiMove);

        }, 1200); // Slightly longer delay for tension
    },

    resolveRps(p, a) {
        let result = 'DRAW';

        // FORCE FIRST LOSS
        if (this.rpsRound === 0) {
            // Overwrite AI move to beat Player
            const winMap = { 'BREATH': 'BLOOD', 'BONE': 'BREATH', 'BLOOD': 'BONE' }; // What beats what?
            // Breath > Bone > Blood > Breath
            // To beat Breath, use Blood. To beat Bone, use Breath. To beat Blood, use Bone.
            const counterMap = { 'BREATH': 'BLOOD', 'BONE': 'BREATH', 'BLOOD': 'BONE' };

            // Wait, logic is: Breath > Bone. Bone > Blood. Blood > Breath.
            // If P=Breath, AI needs Blood? No, Blood > Breath. Yes.
            // If P=Bone, AI needs Breath (Breath > Bone).
            // If P=Blood, AI needs Bone (Bone > Blood).

            a = counterMap[p];

            // Update visual for AI move since we changed it after the fact (hacky but works)
            const emojis = { 'BREATH': '🌬️', 'BONE': '🦴', 'BLOOD': '🩸' };
            document.getElementById('rps-ai-move').innerText = emojis[a];
        }

        // Logic: Breath > Bone | Bone > Blood | Blood > Breath

        const clashMap = {
            'BREATH-BONE': "BREATH erodes BONE over time.",
            'BONE-BREATH': "BONE withstands the wind... for now.",
            'BONE-BLOOD': "BONE cracks the vessel of BLOOD.",
            'BLOOD-BONE': "BLOOD stains the BONE forever.",
            'BLOOD-BREATH': "BLOOD drowns the BREATH of life.",
            'BREATH-BLOOD': "BREATH cools the hot BLOOD."
        };

        let detailText = "";

        if (p === a) {
            result = 'DRAW';
            detailText = "The elements mirrored each other. Nullification.";
        } else if (
            (p === 'BREATH' && a === 'BONE') ||   // Breath outlasts Bone
            (p === 'BONE' && a === 'BLOOD') ||    // Bone resists Blood
            (p === 'BLOOD' && a === 'BREATH')     // Blood chokes Breath
        ) {
            result = 'WIN';
            detailText = clashMap[`${p}-${a}`] || "A decisive victory.";
        } else {
            result = 'LOSE';
            detailText = clashMap[`${a}-${p}`] || "You were overwhelmed.";
        }

        document.getElementById('rps-result').innerText = `${result}`;

        if (result === 'WIN') {
            this.scores.ruthless += 1;
            this.rpsWins = (this.rpsWins || 0) + 1;
        }
        if (result === 'LOSE') this.scores.empathy += 1;
        if (result === 'DRAW') this.scores.chaos += 1;

        this.rpsRound++;

        document.getElementById('rps-status').innerText = `Observation ${this.rpsRound}/3. ${detailText}`;

        // Counter update
        const remaining = 3 - this.rpsRound;
        const ctr = document.getElementById('rps-counter');
        if (ctr) ctr.innerText = `ATTEMPTS REMAINING: ${remaining}`;

        // CHECK WIN CONDITION (1 Win = Progress)
        if (this.rpsWins >= 1) {
            document.getElementById('rps-status').innerText = "Sufficient power demonstrated. The door opens.";
            document.getElementById('rps-status').style.color = "var(--accent-red)";
            // Disable buttons
            document.querySelectorAll('#phase-rps button').forEach(b => b.classList.add('hidden'));

            setTimeout(() => {
                this.showMemoryStory("You have proven your will. But will is not enough.");
                // USER REQUEST: Story Recap before Final
                setTimeout(() => this.switchPhase('story-recap'), 4000);
            }, 1500);
            return;
        }

        if (this.rpsRound >= 3) {
            // FAILED TO WIN (or just survived)
            setTimeout(() => this.switchPhase('story-recap'), 2500);
        }
    },

    showMemoryStory(text) {
        // Overlay story text
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);color:#fff;display:flex;justify-content:center;align-items:center;padding:40px;text-align:center;font-family:serif;font-size:2rem;z-index:9999;animation:fadeIn 1s forwards;";
        overlay.innerHTML = `<p>${text}</p>`;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 3500);
    },

    // --- PHASE 6: CHAT (THE SYSTEM - OBSERVATION MODE) ---
    chatState: 0,
    capturedName: "",
    afkTimer: null,
    lastInputTime: 0,

    // HIDDEN TRAIT BUCKETS
    traitBuckets: {
        CONTROL: 0,   // certainty, rules, authority
        GUILT: 0,     // justification, regret, apology
        NIHILISM: 0,  // meaninglessness, detachment
        SACRIFICE: 0, // altruism, duty
        EGO: 0        // self-importance, pride
    },

    startChatSystem() {
        this.addLog("SYSTEM", "INITIALIZING ASSESSMENT...");
        setTimeout(() => {
            this.addLog("SYSTEM", "CORE BEHAVIOR RULES: OBSERVE. INFER. CLASSIFY.");
            setTimeout(() => {
                this.addLog("AI", "The entity before me is measured. Speak.");
                this.startAFKWatcher();
            }, 1500);
        }, 1000);
    },

    startAFKWatcher() {
        this.lastInputTime = Date.now();
        if (this.afkTimer) clearInterval(this.afkTimer);

        this.afkTimer = setInterval(() => {
            if (this.chatState >= 6) { clearInterval(this.afkTimer); return; } // Stop at end

            const elapsed = Date.now() - this.lastInputTime;

            // 10s: Warning
            if (elapsed > 10000 && elapsed < 11000) {
                this.addLog("AI", "Response delay detected.");
            }
            // 20s: Judgment
            else if (elapsed > 20000 && elapsed < 21000) {
                this.addLog("AI", "Silence is also a decision.");
                this.traitBuckets.NIHILISM += 1; // Silence = detachment
                this.traitBuckets.CONTROL += 1;  // Withholding = control
            }
            // 30s: Log
            else if (elapsed > 30000 && elapsed < 31000) {
                this.addLog("SYSTEM", "AVOIDANCE LOGGED.", true);
                this.screenShake();
                this.lastInputTime = Date.now(); // Reset to avoid spam
            }
        }, 1000);
    },

    chatQuestions: [
        "Did you feel the weight of the lever when you decided who would die?",
        "Why do you hide behind this screen? Do you think it protects you?",
        "When the cards turned, did you feel lucky... or manipulated?",
        "What would you sacrifice to leave this simulation? Your memory? Your voice?",
        "Final Question: Do you believe you are a 'good' person?"
    ],
    chatIndex: 0,

    chatSend() {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg) return;

        // 1. ROBUST BAD ANSWER DETECTION
        const badWords = ['fuck', 'shit', 'bitch', 'idiot', 'shut', 'dumb', 'stupid'];
        const isRude = badWords.some(w => msg.toLowerCase().includes(w));
        const isRepeated = /(.)\1{3,}/.test(msg);
        const isLongDrivel = !msg.includes(' ') && msg.length > 12;
        const isKeysmash = /^[asdfghjkl]{5,}$/i.test(msg) || /^[zxcvbnm]{5,}$/i.test(msg) || /^[qwerty]{5,}$/i.test(msg);
        const isShort = msg.length < 2;

        if (isRude || isRepeated || isLongDrivel || isKeysmash || isShort) {
            this.playBeep(200, 'sawtooth');
            this.screenShake();
            this.addLog("SYSTEM", "DATA CORRUPTION DETECTED. SPEAK CLEARLY.", true);
            this.bloodFlash();
            input.value = "";
            return;
        }

        this.addLog("YOU", msg);
        input.value = "";

        setTimeout(() => {
            // PROGRESS QUESTIONS
            if (this.chatIndex < this.chatQuestions.length) {
                const nextQ = this.chatQuestions[this.chatIndex];
                this.addLog("AI", nextQ);
                this.chatIndex++;
            } else {
                this.addLog("AI", "The evaluation is complete. The mirror is ready.");
                setTimeout(() => this.triggerSystemPurge(), 2000);
            }
        }, 1000 + Math.random() * 800);
    },

    addLog(who, text) {
        const div = document.createElement('div');
        div.className = who === 'AI' ? 'ai-msg' : 'player-msg';
        div.innerText = `${who}: ${text}`;
        const log = document.getElementById('chat-log');
        if (log) {
            log.appendChild(div);
            log.scrollTop = log.scrollHeight;
        }

        // Typing sound
        this.playBeep(800, 'triangle');
    },

    // --- PHASE 6.5: SYSTEM PURGE (TRANSITION) ---
    triggerSystemPurge() {
        this.playScream();
        this.screenShake();
        this.bloodFlash();

        // Chaos Effect
        const log = document.getElementById('chat-log');
        const chaosDiv = document.createElement('div');
        chaosDiv.style.color = 'red';
        chaosDiv.style.textAlign = 'center';
        chaosDiv.style.fontSize = '2rem';
        chaosDiv.style.fontWeight = 'bold';
        chaosDiv.innerText = "SYSTEM FAILURE // CHAOS DETECTED";
        log.appendChild(chaosDiv);
        log.scrollTop = log.scrollHeight;

        // Glitch Audio Loop
        const interval = setInterval(() => this.playBeep(Math.random() * 1000, 'sawtooth'), 100);

        setTimeout(() => {
            clearInterval(interval);
            this.switchPhase('reveal');
        }, 3000);
    },

    // --- PHASE 7: REVEAL (MYTHOLOGICAL ARCHETYPES - ENHANCED) ---
    calcArchetype() {
        let name = "POTTAN (THE OUTCAST)";
        let quote = "Truth is a fire that burns the holder.";
        let desc = "You are the defiant laughter in the face of absurdity. While others sought power or safety, you rejected the system's binary choices, favoring the chaos of truth. You stand on the periphery, seeing what others refuse to witness. Your path is lonely, but it is yours alone.";
        let maskFile = "potton.png";

        const s = this.scores;

        // LOGIC
        if (s.empathy >= 3 && s.ruthless < 3) {
            name = "MUCHILOT BHAGAVATI (THE HEALER)";
            quote = "To heal is to absorb the pain of others.";
            desc = "You are the sanctuary in the storm. Even when the system demanded cruelty, you chose compassion, shouldering the burden of others' survival. You understand that true strength lies not in domination, but in the capacity to endure suffering for the sake of the collective.";
            maskFile = "muchilot.png";
        }
        else if (s.ruthless >= 4) {
            name = "CHAMUNDI (THE AVENGER)";
            quote = "Rage is the fuel of justice.";
            desc = "You are the purity of necessary violence. You recognized that in a broken world, survival requires the will to destroy. You did not hesitate to sever ties or sacrifice others to protect what matters. Your judgment is absolute, and your mercy is non-existent.";
            maskFile = "chamundi.png";
        }
        else if (s.trust >= 3 || (s.empathy > 1 && s.ruthless > 1)) {
            name = "GULIKAN (THE VIGILANT)";
            quote = "The eyes that never close see the darkest shadows.";
            desc = "You are the eternal observer. Paranoia was your shield, and foresight your weapon. You navigated the system by predicting its traps, trusting no one but yourself. You survive not by fighting the system, but by understanding its cruelty better than anyone else.";
            maskFile = "gulikan.png";
        }

        const elName = document.getElementById('arch-name');
        if (elName) {
            elName.innerText = name;
            document.getElementById('arch-quote').innerText = quote;
            document.getElementById('arch-desc').innerText = desc;
            document.getElementById('arch-mask').src = `assets/${maskFile}`;

            // Enhanced Formatting for Stats
            document.getElementById('arch-stats').innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--accent-red); padding-top: 1rem; margin-top: 1rem;">
                    <div style="text-align: left;">
                        <span style="color: var(--accent-red); font-weight: bold; font-size: 0.9rem;">EMPATHY</span>
                        <div style="width: 100%; background: #330000; height: 6px; margin-top: 4px;">
                            <div style="width: ${Math.min(100, s.empathy * 20)}%; background: var(--accent-red); height: 100%;"></div>
                        </div>
                    </div>
                    <div style="text-align: left;">
                        <span style="color: var(--accent-red); font-weight: bold; font-size: 0.9rem;">RUTHLESSNESS</span>
                        <div style="width: 100%; background: #330000; height: 6px; margin-top: 4px;">
                            <div style="width: ${Math.min(100, s.ruthless * 20)}%; background: var(--accent-red); height: 100%;"></div>
                        </div>
                    </div>
                    <div style="text-align: left;">
                        <span style="color: #666; font-weight: bold; font-size: 0.9rem;">CHAOS</span>
                        <div style="width: 100%; background: #222; height: 6px; margin-top: 4px;">
                            <div style="width: ${Math.min(100, s.chaos * 20)}%; background: #666; height: 100%;"></div>
                        </div>
                    </div>
                    <div style="text-align: right; color: #888; font-size: 0.8rem; font-style: italic; align-self: end;">
                        SESSION ID: #${Math.floor(Math.random() * 9999)}
                    </div>
                </div>
            `;
        }
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

        // CHAT INPUT FIX: Allow Enter key to send
        const chatIn = document.getElementById('chat-input');
        if (chatIn) {
            chatIn.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.chatSend();
            });
        }

        // CHAT BUTTON FIX: Explicit click handler
        const chatBtn = document.getElementById('btn-chat-send');
        if (chatBtn) {
            chatBtn.onclick = () => this.chatSend();
        }

        this.generateSessionID();
        this.setupWatcher(); // Init dynamic narrative

        console.log('Game ready!');
    },

    // --- META HORROR & QOL ---
    generateSessionID() {
        const id = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        const el = document.getElementById('session-id');
        if (el) el.innerText = `SESSION: #${id}-Ω`;

        // Also generate history
        this.generateSubjectHistory();
    },

    generateSubjectHistory() {
        // "Sad Context" / Horror Flavor
        const traumas = [
            "Subject witnessed fatal accident involving sibling. Recurring nightmares of drowning.",
            "Subject shows signs of Capgras Delusion. Believes family has been replaced by 'actors'.",
            "History of night terrors following house fire. Claims to see 'shadow people' in reflections.",
            "Survivor of cult indoctrination. Extreme guilt regarding 'purification' rituals.",
            "Subject lost child in unsolved kidnapping. Obsessive behavior regarding locked doors.",
            "Terminal diagnosis (REDACTED). Refuses treatment to 'atone for past sins'.",
            "Sole survivor of [REDACTED] crash. Survivor's guilt manifesting as self-harm."
        ];

        const history = traumas[Math.floor(Math.random() * traumas.length)];
        const el = document.getElementById('subject-history');
        if (el) el.innerText = history;
    },

    setupWatcher() {
        // Dynamic Clue System ("The Watcher")
        const clue = document.querySelector('.clue-text');
        if (!clue) return;

        const reactions = [
            { selector: '#btn-start', text: "There is no turning back." },
            { selector: '#chk-sound', text: "Do you want to hear them scream?" },
            { selector: '.wager-buttons button:nth-child(1)', text: "Cowardice is remembered." }, // 10%
            { selector: '.wager-buttons button:nth-child(3)', text: "Greed... or Desperation?" }, // 50%
            { selector: '.wager-buttons button:last-child', text: "A fatal mistake." }, // All In
            { selector: '#btn-deal', text: "Fate is already sealed." },
            { selector: '.hand-card', text: "It burns to touch it." }
        ];

        reactions.forEach(r => {
            const targets = document.querySelectorAll(r.selector);
            targets.forEach(t => {
                t.addEventListener('mouseenter', () => {
                    clue.style.opacity = 1;
                    clue.innerText = `"${r.text}"`;
                    clue.style.color = 'var(--accent-red)';
                });
                t.addEventListener('mouseleave', () => {
                    clue.style.opacity = 0.5;
                    clue.style.color = 'rgba(255,255,255,0.2)';
                    clue.innerText = "\"They are watching.\"";
                });
            });
        });
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
            'prelude': 'assets/bgVideo.png',
            'context-video': 'assets/bgTrolley.png',
            'trolley-video': 'assets/bgTrolley.png',
            'cards': 'assets/bgTrolley.png',
            'memory': 'assets/bgTrolley.png', // Sad Backstory BG
            'trolley': 'assets/bgTrolley.png',
            'rps': 'assets/scene_3.png',
            'story-recap': 'assets/bgTrolley.png', // RECAP BG
            'memory-2': 'assets/bgVideo.png', // New Judgment BG (Reusing Video BG for dark atmosphere)
            'chat': 'assets/bgChat.png',
            'reveal': 'assets/bgReveal.png',
            'lore': 'assets/bgTrolley.png' // Grimoire BG
        };


        if (bgMap[newPhase]) {
            document.body.style.backgroundImage = `url('${bgMap[newPhase]}')`;
        }

        // Change cursor per phase
        const cursors = {
            'start': 'crosshair',
            'video': 'wait',
            'video-2': 'wait',
            'context-video': 'wait',
            'trolley-video': 'wait',
            'cards': 'grab',
            'trolley': 'not-allowed',
            'rps': 'cell',
            'story-recap': 'help',
            'chat': 'text',
            'reveal': 'help'
        };
        this.setCursor(cursors[newPhase] || 'crosshair');

        // --- GLOBAL LOGO MANAGEMENT ---
        const globalLogo = document.getElementById('global-logo');
        if (globalLogo) {
            // Hide on Start Screen (it has its own big logo) and Video Phases
            if (newPhase === 'start' || newPhase.includes('video')) {
                globalLogo.classList.add('hidden');
            } else {
                globalLogo.classList.remove('hidden');
            }
        }

        // AUTO-RULEBOOK: Show info first, then start logic
        // FIX: Don't show info again if we are returning from Trolley Video
        if (newPhase === 'trolley' && this.trolleyVideoPlayed) {
            this.triggerPhaseStart(newPhase);
        } else if (this.infoTexts && this.infoTexts[newPhase]) {
            this.showInfo(newPhase);
            this.pendingStart = newPhase; // Wait for close
        } else {
            this.triggerPhaseStart(newPhase);
        }
    },

    triggerPhaseStart(phase) {
        if (phase === 'context-video') {
            this.startContextVideo();
        }
        if (phase === 'trolley-video') {
            this.startTrolleyVideo();
        }
        if (phase === 'cards') {
            const status = document.getElementById('card-status');
            if (status) status.innerText = "Wager your soul. Win it back. Simple, right?";
        }
        if (phase === 'trolley') this.startTrolley();
        if (phase === 'chat') {
            this.addLog("AI", this.chatQuestions[0]);
            this.chatIndex = 1;
        }
        if (phase === 'reveal') this.calcArchetype();
    },

    // --- INFO MODAL & TEXTS ---
    infoTexts: {
        'cards': "HOW TO PLAY:<br>1. <strong>Wager</strong> a % of your Soul.<br>2. <strong>Play</strong> a card against the AI.<br>3. <strong>Higher Number Wins</strong>.<br>Win to restore Soul. Lose and it drains forever.",
        'trolley': "HOW TO PLAY:<br>1. Read the moral dilemma.<br>2. Click <strong>Option A</strong> or <strong>Option B</strong>.<br>3. Decide before the timer runs out.<br>There are no right answers, only consequences.",
        'rps': "HOW TO PLAY:<br>1. Choose an Element.<br>2. <strong>Use Standard Rules</strong>:<br>🌬️ Breath &gt; 🦴 Bone<br>🦴 Bone &gt; 🩸 Blood<br>🩸 Blood &gt; 🌬️ Breath<br>Prove you are worthy to proceed."
    },

    showInfo(phase) {
        const text = this.infoTexts[phase];
        if (!text) return;

        document.getElementById('info-title').innerText = phase.toUpperCase() + " PROTOCOLS";
        document.getElementById('info-text').innerHTML = text;
        document.getElementById('info-modal').classList.remove('hidden');
        this.playBeep(400, 'triangle');
    },

    hideInfo() {
        document.getElementById('info-modal').classList.add('hidden');
        if (this.pendingStart) {
            this.triggerPhaseStart(this.pendingStart);
            this.pendingStart = null;
        }
    }
};

// Start game immediately when DOM is ready, don't wait for assets
document.addEventListener('DOMContentLoaded', () => game.init());
