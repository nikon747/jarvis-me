export const JarvisOrb = ({ isActive, isRecording, isSpeaking }) => {
  const getOrbState = () => {
    if (isRecording) return 'recording';
    if (isSpeaking) return 'speaking';
    if (isActive) return 'active';
    return 'idle';
  };

  const orbState = getOrbState();

  return (
    <div className="relative" data-testid="jarvis-orb">
      {/* Outer glow ring */}
      <div 
        className={`absolute -inset-4 rounded-full transition-opacity duration-500 ${
          orbState !== 'idle' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: orbState === 'recording' 
            ? 'radial-gradient(circle, rgba(255,59,48,0.2) 0%, transparent 70%)' 
            : 'radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)'
        }}
      />
      
      {/* Main orb */}
      <div 
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          orbState === 'idle' 
            ? 'bg-obsidian border border-neon-blue/30' 
            : orbState === 'recording'
            ? 'bg-alert-red/20 border-2 border-alert-red recording-pulse'
            : orbState === 'speaking'
            ? 'bg-neon-blue/20 border-2 border-neon-blue orb-speaking'
            : 'bg-neon-blue/10 border-2 border-neon-blue orb-active'
        }`}
      >
        {/* Inner core */}
        <div 
          className={`w-8 h-8 rounded-full transition-all duration-300 ${
            orbState === 'idle'
              ? 'bg-neon-blue/20'
              : orbState === 'recording'
              ? 'bg-alert-red'
              : 'bg-neon-blue'
          }`}
          style={{
            boxShadow: orbState !== 'idle' 
              ? orbState === 'recording'
                ? '0 0 20px rgba(255,59,48,0.8), inset 0 0 10px rgba(255,255,255,0.3)'
                : '0 0 20px rgba(0,240,255,0.8), inset 0 0 10px rgba(255,255,255,0.3)'
              : 'none'
          }}
        />

        {/* Pulse rings */}
        {orbState !== 'idle' && (
          <>
            <div 
              className={`absolute inset-0 rounded-full animate-ping ${
                orbState === 'recording' ? 'bg-alert-red/30' : 'bg-neon-blue/30'
              }`}
              style={{ animationDuration: '2s' }}
            />
            <div 
              className={`absolute inset-[-8px] rounded-full border ${
                orbState === 'recording' ? 'border-alert-red/20' : 'border-neon-blue/20'
              } animate-pulse`}
            />
          </>
        )}
      </div>

      {/* Status text */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-[10px] font-mono tracking-widest ${
          orbState === 'recording' ? 'text-alert-red' : 
          orbState === 'idle' ? 'text-muted-foreground' : 'text-neon-blue'
        }`}>
          {orbState === 'idle' && 'STANDBY'}
          {orbState === 'active' && 'PROCESSING'}
          {orbState === 'recording' && 'LISTENING'}
          {orbState === 'speaking' && 'SPEAKING'}
        </span>
      </div>
    </div>
  );
};

export default JarvisOrb;
