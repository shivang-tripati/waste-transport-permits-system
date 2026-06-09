'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import plantImg from '@/../public/image/1.jpeg';
import plantImg2 from '@/../public/image/2.jpeg';
import plantImg4 from '@/../public/image/3.jpeg';
import plantImg5 from '@/../public/image/4.jpeg';
import plantImg6 from '@/../public/image/5.jpeg';
import plantImg7 from '@/../public/image/6.jpeg';
import plantImg8 from '@/../public/image/7.jpeg';
import plantImg9 from '@/../public/image/8.jpeg';

const slides = [
  {
    image: plantImg,
    caption: 'Authorized Construction & Demolition Waste Processing Facility',
  },
  {
    image: plantImg2,
    caption: 'Scientific Segregation and Handling of C&D Waste',
  },
  {
    image: plantImg4,
    caption: 'Authorized Construction & Demolition Waste Processing Facility',
  },
  {
    image: plantImg5,
    caption: 'Scientific Segregation and Handling of C&D Waste',
  },
  {
    image: plantImg6,
    caption: 'Authorized Construction & Demolition Waste Processing Facility',
  },
  {
    image: plantImg7,
    caption: 'Scientific Segregation and Handling of C&D Waste',
  },
  {
    image: plantImg8,
    caption: 'Authorized Construction & Demolition Waste Processing Facility',
  },
  {
    image: plantImg9,
    caption: 'Scientific Segregation and Handling of C&D Waste',
  },
];

export default function GovHeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 6000); // slow govt-style slide

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[420px] md:h-[420px] border border-border bg-white overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.caption}
            fill
            className="object-cover object-center"
            priority={index === 0}
            quality={100}
            
          />

          {/* Caption */}
          <div className="absolute bottom-0 w-full bg-black/60 text-white text-sm px-4 py-2">
            {slide.caption}
          </div>
        </div>
      ))}
    </div>
  );
}
