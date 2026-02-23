
export const useSound = () => {
    const play = (type: 'hover' | 'click' | 'success' | 'error') => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            if (type === 'hover') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            } else if (type === 'click') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            } else if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
                osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            }

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            // Audio context might be blocked by browser policy
        }
    };
    return { play };
};
