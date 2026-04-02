<!--
  TriggerButton — floating action trigger with smooth superellipse corners.
  First component of the core UI kit for floating menus.

  Themable via CSS custom properties (set on any ancestor):
    --sb--trigger-bg         Background color        (default: slate-100)
    --sb--trigger-bg-hover   Background on hover/active (default: slate-200)
    --sb--trigger-text       Text / icon color        (default: slate-600)
    --sb--trigger-border     Border color             (default: slate-400)
-->

<script module>
  import { cn } from "../../../utils/index.js";

  // Register CSS Houdini paint worklet for superellipse masks.
  // Inlined from smooth-corners (MIT) to avoid Vite-specific ?url import
  // that breaks when this source is consumed from node_modules.
  if (typeof CSS !== 'undefined' && 'paintWorklet' in CSS) {
    try {
      const worklet = `class P{static get inputProperties(){return["--sb--smooth-corners"]}superellipse(a,b,nX=4,nY){if(Number.isNaN(nX))nX=4;if(typeof nY==="undefined"||Number.isNaN(nY))nY=nX;if(nX>100)nX=100;if(nY>100)nY=100;if(nX<1e-11)nX=1e-11;if(nY<1e-11)nY=1e-11;const nX2=2/nX,nY2=nY?2/nY:nX2,steps=360,step=(2*Math.PI)/steps;return Array.from({length:steps},(_,i)=>{const t=i*step,cosT=Math.cos(t),sinT=Math.sin(t);return{x:Math.abs(cosT)**nX2*a*Math.sign(cosT),y:Math.abs(sinT)**nY2*b*Math.sign(sinT)}})}paint(ctx,geom,props){const[nX,nY]=props.get("--sb--smooth-corners").toString().replace(/ /g,"").split(",");const w=geom.width/2,h=geom.height/2,s=this.superellipse(w,h,parseFloat(nX),parseFloat(nY));ctx.fillStyle="#000";ctx.setTransform(1,0,0,1,w,h);ctx.beginPath();for(let i=0;i<s.length;i++){const{x,y}=s[i];i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.closePath();ctx.fill()}}registerPaint("smooth-corners",P);`;
      const blob = new Blob([worklet], { type: 'application/javascript' });
      CSS.paintWorklet.addModule(URL.createObjectURL(blob));
    } catch {}
  }
</script>

<script>
  import { Button } from '../../../components/ui/button/index.js'

  let {
    class: className,
    wrapperClass = "",
    active = false,
    inactive = false,
    dimmed = false,
    localOnly = false,
    size = "icon-2xl",
    children,
    ...restProps
  } = $props();

  const borderWidth = $derived(
    ['icon-2xl', 'icon-xl', '2xl', 'xl'].includes(size) ? '3px' : '2px'
  );
</script>

<span
  data-trigger-button
  data-active={active || undefined}
  data-inactive={inactive || undefined}
  data-dimmed={dimmed || undefined}
  data-local-only={localOnly || undefined}
  style:--sb--trigger-border-width={borderWidth}
>
  <Button
    variant="trigger"
    {size}
    disabled={inactive}
    wrapperClass={cn(
      "smooth-corners [--sb--smooth-corners:4] hover:rotate-2 focus-visible:rotate-2 transition-transform",
      active && !inactive && "rotate-2",
      wrapperClass
    )}
    class={cn(
      "smooth-corners leading-none font-semibold",
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </Button>
</span>

<style>
  [data-trigger-button] {
    display: inline-flex;
    position: relative;
  }
  [data-trigger-button] :global([data-slot="button-wrapper"]) {
    --sb--sc-border-color: var(--sb--trigger-border, var(--color-slate-400));
    --sb--sc-border-width: var(--sb--trigger-border-width, 3px);
  }
  /* Accent-colored border/gap on focus — follows the superellipse shape */
  [data-trigger-button] :global([data-slot="button-wrapper"]:has([data-slot="button"]:focus-visible)) {
    --sb--sc-border-color: hsl(212 92% 45%);
  }
  [data-trigger-button] :global([data-slot="button"]) {
    background-color: var(--sb--trigger-bg, var(--color-slate-100));
    color: var(--sb--trigger-text, var(--color-slate-600));
  }
  [data-trigger-button] :global([data-slot="button"]:hover),
  [data-trigger-button] :global([data-slot="button"]:focus-visible),
  [data-trigger-button] :global([data-slot="button"][aria-expanded="true"]),
  [data-trigger-button][data-active] :global([data-slot="button"]) {
    background-color: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  /* Inactive: disabled-looking, no interaction */
  [data-trigger-button][data-inactive] {
    opacity: 0.45;
    pointer-events: none;
  }

  /* Dimmed: reduced visibility, interactive on hover/focus */
  [data-trigger-button][data-dimmed] {
    opacity: 0.3;
    transition: opacity 200ms;
  }
  [data-trigger-button][data-dimmed]:hover,
  [data-trigger-button][data-dimmed]:focus-within {
    opacity: 1;
  }
</style>
