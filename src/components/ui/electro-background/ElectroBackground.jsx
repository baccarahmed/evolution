"use client"; 
 import React, { useEffect, useRef } from "react"; 
 
 const vertexShaderSource = ` 
   attribute vec2 a_position; 
   varying vec2 vUv; 
   void main() { 
     vUv = a_position * 0.5 + 0.5; 
     gl_Position = vec4(a_position, 0.0, 1.0); 
   } 
 `; 
 
 const fragmentShaderSource = ` 
   precision highp float; 
   uniform vec2 iResolution; 
   uniform float iTime; 
   uniform vec2 iMouse; 
 
   vec2 stanh(vec2 a) { 
       vec2 e = exp(2.0 * clamp(a, -40.0, 40.0)); 
       return (e - 1.0) / (e + 1.0); 
   } 
 
   void mainImage( out vec4 o, vec2 u ) 
   { 
       vec2 v = iResolution.xy; 
       u = 0.2 * (u + u - v) / v.y; 
       
       // Interactive mouse control 
       vec2 mouseNorm = (iMouse.xy / iResolution.xy - 0.5) * 2.0; 
 
       vec4 z = vec4(1.0, 2.0, 3.0, 0.0); 
       o = vec4(1.0, 2.0, 3.0, 0.0); 
       
       float a = 0.5; 
       float t = iTime * 0.5 + mouseNorm.x * 1.5; // Mouse control over timeline state 
       
       for (int idx = 0; idx < 18; ++idx) { 
           float i = float(idx + 1); 
           
           o += (1.0 + cos(z + t)) 
              / length((1.0 + i * dot(v,v)) 
                     * sin(1.5 * u / (0.5 - dot(u,u)) - 9.0 * vec2(u.y, u.x) + t)); 
           
           a += 0.03; 
           t += 1.0; 
           v = cos(t - 7.0 * u * pow(a, i)) - 5.0 * u; 
           
           vec4 cv = cos(i + 0.02 * t - vec4(z.w, z.x, z.z, z.w) * 11.0); 
           mat2 m = mat2(cv.x, cv.y, cv.z, cv.w); 
           u *= m; 
           
           u += stanh(40.0 * dot(u,u) * cos(100.0 * vec2(u.y, u.x) + t)) / 200.0 
              + 0.2 * a * u 
              + cos(4.0 / exp(dot(o,o)/100.0) + t) / 300.0; 
              
           // Warping the electro waves based loosely on cursor position 
           u += mouseNorm * 0.005; 
       } 
                 
        o = 25.6 / (min(o, vec4(13.0)) + 164.0 / o) - dot(u, u) / 250.0; 
        
        o.rgb = max(o.rgb, vec3(0.0)); // Ensure no negative light leaks out 
        
        // Calculate an alpha channel for perfect blending against page backgrounds 
        float intensity = max(o.r, max(o.g, o.b)); 
        float finalAlpha = smoothstep(0.0, 1.2, intensity); // Tuned for beautiful neon fading 
        
        o = vec4(o.rgb * finalAlpha, finalAlpha); 
   } 
 
   void main() { 
     mainImage(gl_FragColor, gl_FragCoord.xy); 
   } 
 `; 
 
 export default function ElectroBackground({ className }) { 
     const canvasRef = useRef(null); 
     const targetMouseRef = useRef({ x: 0, y: 0 }); 
     const currentMouseRef = useRef({ x: 0, y: 0 }); 
 
     useEffect(() => { 
         const canvas = canvasRef.current; 
         if (!canvas) return; 
 
         const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }); 
         if (!gl) { 
             console.error("WebGL not supported"); 
             return; 
         } 
 
         const compileShader = (type, source) => { 
             const shader = gl.createShader(type); 
             if (!shader) return null; 
             gl.shaderSource(shader, source); 
             gl.compileShader(shader); 
             if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { 
                 console.error("Shader compile err:", gl.getShaderInfoLog(shader)); 
                 gl.deleteShader(shader); 
                 return null; 
             } 
             return shader; 
         }; 
 
         const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource); 
         const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource); 
 
         if (!vertexShader || !fragmentShader) return; 
 
         const program = gl.createProgram(); 
         if (!program) return; 
         gl.attachShader(program, vertexShader); 
         gl.attachShader(program, fragmentShader); 
         gl.linkProgram(program); 
 
         gl.useProgram(program); 
 
         const positionBuffer = gl.createBuffer(); 
         gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); 
         const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]); 
         gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW); 
 
         const positionLocation = gl.getAttribLocation(program, "a_position"); 
         gl.enableVertexAttribArray(positionLocation); 
         gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0); 
 
         const iResolutionLocation = gl.getUniformLocation(program, "iResolution"); 
         const iTimeLocation = gl.getUniformLocation(program, "iTime"); 
         const iMouseLocation = gl.getUniformLocation(program, "iMouse"); 
 
         const startTime = performance.now(); 
         let animationFrameId; 
 
         const render = () => { 
             const displayWidth = canvas.clientWidth; 
             const displayHeight = canvas.clientHeight; 
             if (canvas.width !== displayWidth || canvas.height !== displayHeight) { 
                 canvas.width = displayWidth; 
                 canvas.height = displayHeight; 
                 gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); 
             } 
 
             // Standard alpha clearing for transparent backgrounds 
             gl.clearColor(0.0, 0.0, 0.0, 0.0); 
             gl.clear(gl.COLOR_BUFFER_BIT); 
 
             // Interpolate mouse smoothly for premium feel 
             currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * 0.06; 
             currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * 0.06; 
 
             const currentTime = (performance.now() - startTime) / 1000; 
 
             gl.uniform2f(iResolutionLocation, gl.canvas.width, gl.canvas.height); 
             gl.uniform1f(iTimeLocation, currentTime); 
             gl.uniform2f(iMouseLocation, currentMouseRef.current.x, currentMouseRef.current.y); 
 
             // Use independent blending for proper native transparency 
             gl.enable(gl.BLEND); 
             gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
 
             gl.drawArrays(gl.TRIANGLES, 0, 6); 
             animationFrameId = requestAnimationFrame(render); 
         }; 
 
         const handleMouseMove = (e) => { 
             const rect = canvas.getBoundingClientRect(); 
             targetMouseRef.current.x = e.clientX - rect.left; 
             targetMouseRef.current.y = canvas.height - (e.clientY - rect.top); 
         }; 
 
         const handleMouseLeave = () => { 
             targetMouseRef.current.x = canvas.width / 2; 
             targetMouseRef.current.y = canvas.height / 2; 
         }; 
 
         canvas.addEventListener("mousemove", handleMouseMove); 
         canvas.addEventListener("mouseleave", handleMouseLeave); 
 
         targetMouseRef.current.x = canvas.width / 2; 
         targetMouseRef.current.y = canvas.height / 2; 
         currentMouseRef.current.x = targetMouseRef.current.x; 
         currentMouseRef.current.y = targetMouseRef.current.y; 
 
         render(); 
 
         return () => { 
             cancelAnimationFrame(animationFrameId); 
             canvas.removeEventListener("mousemove", handleMouseMove); 
             canvas.removeEventListener("mouseleave", handleMouseLeave); 
             gl.deleteProgram(program); 
             gl.deleteShader(vertexShader); 
             gl.deleteShader(fragmentShader); 
             gl.deleteBuffer(positionBuffer); 
         }; 
     }, []); 
 
     return <canvas ref={canvasRef} className={`w-full h-full block ${className || ""}`} />; 
 }