declare module 'vanta/dist/vanta.net.min' {
    interface VantaNetConfig {
      el: HTMLElement;
      THREE?: any;
      mouseControls?: boolean;
      touchControls?: boolean;
      gyroControls?: boolean;
      minHeight?: number;
      minWidth?: number;
      scale?: number;
      scaleMobile?: number;
      color?: number;
      backgroundColor?: number;
      points?: number;
      maxDistance?: number;
      spacing?: number;
    }
  
    interface VantaEffect {
      destroy(): void;
    }
  
    function NET(config: VantaNetConfig): VantaEffect;
    export default NET;
  }

  declare module 'three' {
    export * from 'three';
  }

  declare module 'vanta/dist/vanta.waves.min' {
    interface VantaWavesConfig {
      el: HTMLElement;
      THREE?: any;
      mouseControls?: boolean;
      touchControls?: boolean;
      gyroControls?: boolean;
      minHeight?: number;
      minWidth?: number;
      scale?: number;
      scaleMobile?: number;
      color?: number;
      shininess?: number;
      waveHeight?: number;
      waveSpeed?: number;
      zoom?: number;
    }
  
    interface VantaEffect {
      destroy(): void;
    }
  
    function WAVES(config: VantaWavesConfig): VantaEffect;
    export default WAVES;
  }
  
