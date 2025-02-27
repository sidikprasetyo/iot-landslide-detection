"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
 
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const carouselImages = [
  {
    src: "/images/picture1.jpg",
    alt: "Gambar slide 1",
    id: 1
  },
  {
    src: "/images/picture2.jpg",
    alt: "Gambar slide 2",
    id: 2
  },
  {
    src: "/images/picture3.jpg",
    alt: "Gambar slide 3",
    id: 3
  }
];

const About = () => {
    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true })
    );

    return (
        <section className="py-2 md:py-3">
            <div className="flex items-center justify-center mx-4 md:mx-8 lg:mx-12">
                <Carousel
                    plugins={[plugin.current]}
                    className="w-full h-60 sm:h-70 md:h-80 lg:h-96 xl:h-[60vh] relative"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                    aria-label="About Landslide Detection System"
                >
                    <CarouselContent>
                        {carouselImages.map((image) => (
                            <CarouselItem key={image.id}>
                                <Card className="h-full overflow-hidden border-0">
                                    <CardContent className="p-0 h-full">
                                        <div className="relative w-full h-full min-h-60 sm:min-h-70 md:min-h-80 lg:min-h-96 xl:min-h-[60vh]">
                                            <Image 
                                                src={image.src} 
                                                alt={image.alt}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <h2 className="text-3xl font-semibold text-gray-100">About System {image.id}</h2>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="absolute z-10 flex items-center justify-between w-full top-1/2 -translate-y-1/2 px-4">
                        <CarouselPrevious className="left-4 bg-white/70 hover:bg-white/90 border-0"/>
                        <CarouselNext className="right-4 bg-white/70 hover:bg-white/90 border-0"/>
                    </div>
                </Carousel>
            </div>
            <article className="mx-4 mt-6 md:mx-8 lg:mx-12 md:mt-3 mb-8 md:mt-8 md:mb-10 space-y-4 text-justify text-sm md:text-base lg:text-lg text-gray-800 dark:text-gray-100">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">About Landslide Detection</h1>
                <p>
                    Perusahaan kami didirikan dengan visi untuk memberikan layanan terbaik di bidangnya. Dengan tim profesional yang berpengalaman, kami berkomitmen untuk selalu mengutamakan kualitas dan kepuasan pelanggan dalam setiap aspek layanan kami.
                </p>
                <p>
                    Selama bertahun-tahun, kami telah membangun reputasi sebagai pemimpin industri yang inovatif dan terpercaya. Nilai-nilai inti kami meliputi integritas, transparansi, dan dedikasi untuk kesempurnaan. Kami terus beradaptasi dengan perkembangan teknologi dan tren pasar untuk memastikan bahwa solusi yang kami tawarkan selalu relevan dan efektif.
                </p>
                <p>
                    Kami percaya bahwa kesuksesan kami terkait erat dengan kesuksesan klien kami. Itulah mengapa kami selalu berusaha memahami kebutuhan unik setiap klien dan menyediakan solusi yang disesuaikan untuk memenuhi tujuan bisnis mereka.
                </p>
            </article>
        </section>
    );
};

export default About;