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
                                                {/* <h2 className="text-3xl font-semibold text-gray-100">About System {image.id}</h2> */}
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
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">Landslide Detection System</h1>
                <p>
                    This landslide early detection system is an Internet of Things-based solution designed to monitor soil conditions in real time and provide early warnings of potential landslides. The device uses an ESP32 microcontroller and is equipped with various sensors, including the MPU6050 tilt sensor, Raindrop YL-83 rain sensor, and capacitive soil moisture sensor. To ensure reliable power supply, the system can operate using either a battery or a direct USB adapter, with battery capacity monitored through the INA219 DC current sensor. Additionally, it features a buzzer and an RGB LED 140C05 to provide both visual and audio alerts when hazardous conditions are detected.
                </p>
                <p>
                    Sensor data is transmitted in real time to the website’s main page using WebSocket, allowing users to monitor environmental changes instantly. Furthermore, every five seconds, the data is sent to a Supabase database for storage and further analysis. On the website’s dashboard, users can access historical data records to observe environmental trends over time. By integrating these technologies, the landslide early detection system helps mitigate disaster risks by providing accurate and timely information to users.
                </p>
            </article>
        </section>
    );
};

export default About;