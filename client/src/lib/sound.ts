// Sound utility for playing notification sounds

// Simple beep sound for incident notifications
export function playIncidentNotificationSound(type: 'roadblock' | 'accident') {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    
    // Set different frequencies for different incident types
    oscillator.frequency.value = type === 'roadblock' ? 440 : 520; // A4 or C5
    oscillator.type = 'sine';
    
    gain.gain.value = 0.1; // Keep volume low
    oscillator.connect(gain);
    gain.connect(context.destination);
    
    // Play a short beep
    oscillator.start();
    
    // Stop after 500ms for 'roadblock' or 250ms for 'accident'
    setTimeout(() => {
      oscillator.stop();
      // If it's an accident, play a second beep after a short delay
      if (type === 'accident') {
        setTimeout(() => {
          const secondOscillator = context.createOscillator();
          secondOscillator.frequency.value = 520;
          secondOscillator.type = 'sine';
          secondOscillator.connect(gain);
          secondOscillator.start();
          setTimeout(() => secondOscillator.stop(), 250);
        }, 150);
      }
    }, type === 'roadblock' ? 500 : 250);
    
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}