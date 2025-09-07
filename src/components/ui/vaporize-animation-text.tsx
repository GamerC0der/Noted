'use client'

import { useEffect, useRef, useMemo } from 'react'
import { FeyButton } from "./button"
import VaultLock from "./vault-lock"
import NotepadCard from "./notepad-card"
import AICard from "./ai-card"
import Link from "next/link"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileText, Folder, Settings, HelpCircle } from "lucide-react";

type Particle = {
    x: number
    y: number
    originalX: number
    originalY: number
    previousX: number
    previousY: number
    color: string
    opacity: number
    originalAlpha: number
    velocityX: number
    velocityY: number
    angle: number
    speed: number
    shouldFadeQuickly?: boolean
    scale: number
    rotation: number
    rotationSpeed: number
    hue: number
    saturation: number
    lightness: number
    turbulence: number
}

type CreatingPageProps = {
    texts?: string[]
}

export function VaporizeAnimationText({ texts = ["Cool"] }: CreatingPageProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])

    const config = useMemo(() => ({
        color: "rgb(255, 255, 255)",
        font: {
            fontFamily: "Inter, sans-serif",
            fontSize: "70px",
            fontWeight: 600
        },
        effects: {
            glow: true
        }
    }), [])

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const updateCanvasSize = () => {
            const { width, height } = containerRef.current!.getBoundingClientRect()
            canvas.width = width
            canvas.height = height
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
        }
        updateCanvasSize()

        const createParticles = (text: string) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            ctx.fillStyle = config.color
            ctx.font = `${config.font.fontWeight} ${config.font.fontSize} ${config.font.fontFamily}`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            const x = canvas.width / 2
            const y = canvas.height / 2
            ctx.fillText(text, x, y)

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            const particles: Particle[] = []

            const sampleRate = 4
            for (let y = 0; y < canvas.height; y += sampleRate) {
                for (let x = 0; x < canvas.width; x += sampleRate) {
                    const index = (y * canvas.width + x) * 4
                    const alpha = data[index + 3]

                    if (alpha > 0) {
                        const particle: Particle = {
                            x,
                            y,
                            originalX: x,
                            originalY: y,
                            previousX: x,
                            previousY: y,
                            color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${alpha / 255})`,
                            opacity: alpha / 255,
                            originalAlpha: alpha / 255,
                            velocityX: 0,
                            velocityY: 0,
                            angle: Math.random() * Math.PI * 2,
                            speed: 0,
                            scale: 1,
                            rotation: Math.random() * Math.PI * 2,
                            rotationSpeed: (Math.random() - 0.5) * 0.2,
                            hue: 0,
                            saturation: 0,
                            lightness: 100,
                            turbulence: Math.random() * 0.3
                        }
                        particles.push(particle)
                    }
                }
            }

            particlesRef.current = particles
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        const drawGlow = (x: number, y: number, radius: number, color: string) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
            gradient.addColorStop(0, color)
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
        }

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            particlesRef.current.forEach(particle => {
                ctx.fillStyle = particle.color
                ctx.fillRect(particle.x, particle.y, 2, 2)

                if (config.effects.glow) {
                    drawGlow(particle.x, particle.y, 2, particle.color)
                }
            })
        }

        createParticles(texts[0])
        drawParticles()

        window.addEventListener('resize', () => {
            updateCanvasSize()
            createParticles(texts[0])
            drawParticles()
        })

        return () => {
            window.removeEventListener('resize', updateCanvasSize)
        }
    }, [config, texts])

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className="relative w-full h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-center pointer-events-none min-h-full">
                        <div className="flex flex-col items-center space-y-12 py-8">
                            <div className="relative">
                        <div ref={containerRef} className="w-80 h-20 flex items-center justify-center">
                            <canvas ref={canvasRef} className="w-full h-full" />
                        </div>
                        <span className="absolute inset-0 flex items-center justify-center text-7xl font-semibold text-white select-text pointer-events-auto">
                            {texts[0]}
                        </span>
                    </div>
                    <div className="pointer-events-auto">
                        <Link href="/write">
                            <FeyButton className="scale-110">
                                Start Writing
                            </FeyButton>
                        </Link>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-white text-center mb-6">Features</h2>
                        <div className="flex justify-center items-center gap-8">
                            <VaultLock 
                                cardTitle="Secure"
                                cardDescription="Your notes are your notes"
                            />
                            <NotepadCard 
                                cardTitle="Note It Down"
                                cardDescription="Quick and Easy"
                            />
                            <AICard 
                                cardTitle="AI Integrated"
                                cardDescription="Hyper-Fast AI"
                            />
                        </div>
                    </div>
                            <div className="mt-8">
                                <p className="text-xs text-gray-400">© 2025 Noted</p>
                            </div>
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent className="w-48">
                <ContextMenuItem asChild>
                    <Link href="/write">
                        <FileText className="mr-2 h-4 w-4" />
                        Start Writing
                    </Link>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem asChild>
                    <Link href="/write">
                        <Folder className="mr-2 h-4 w-4" />
                        Create Folder
                    </Link>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => window.open('https://github.com', '_blank')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </ContextMenuItem>
                <ContextMenuItem onClick={() => window.open('https://github.com', '_blank')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
