"use client";
import React from 'react';

/**
 * S3TLogo - Integrated Monogram (A2B Inspired)
 * Features S, 3, and T tightly nested in the center of the oval.
 * The '3' is the primary vertical anchor, with S and T flanking it.
 */
export default function S3TLogo({ className = "w-24 h-auto" }: { className?: string }) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#F9E27E', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
                    </linearGradient>
                    <filter id="premium-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* The Golden Oval Frame */}
                <ellipse
                    cx="120" cy="60" rx="100" ry="50"
                    stroke="url(#goldGradient)"
                    strokeWidth="4"
                    fill="rgba(0, 0, 0, 0.6)"
                />

                {/* Monogram S3T: Interlinked Horizontal Layout */}
                <g fontFamily="'Playfair Display', serif" fontWeight="900" textAnchor="middle" fill="url(#goldGradient)" filter="url(#premium-glow)">
                    {/* S - Left */}
                    <text x="70" y="82" fontSize="85">S</text>

                    {/* 3 - Center (Slightly smaller to match S and T visually) */}
                    <text x="120" y="82" fontSize="80">3</text>

                    {/* T - Right */}
                    <text x="170" y="82" fontSize="85">T</text>
                </g>
            </svg>
        </div>
    );
}
