import * as React from "react";
import { MailIcon, MessageCircleMoreIcon } from "lucide-react";

const Contact = () => {
  return (
    <section className="mx-4 mt-2 md:mx-8 lg:mx-12 md:mt-3" aria-labelledby="contact-heading">
      <h1 id="contact-heading" className="text-text-gray-800 dark:text-text-gray-100 text-base md:text-xl lg:text-2xl 3xl:text-3xl font-bold">
        Developer Contacts
      </h1>
      <div className="mt-2 space-y-1 text-xs md:text-sm lg:text-base 3xl:text-lg text-text-gray-800 dark:text-text-gray-100 font-semibold">
        <a 
          href="mailto:sidikprasetyo6661@gmail.com" 
          className="flex flex-end gap-1 items-center hover:underline"
          aria-label="Email sidikprasetyo6661@gmail.com"
        >
          <MailIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 2xl:w-7 2xl:h-7" aria-hidden="true" />
          <span>sidikprasetyo6661@gmail.com</span>
        </a>
        <a 
          href="https://wa.me/6285802697561" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-end gap-1 items-center hover:underline"
          aria-label="WhatsApp +62858 0269 7561"
        >
          <MessageCircleMoreIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 2xl:w-7 2xl:h-7" aria-hidden="true" />
          <span>+62858 0269 7561</span>
        </a>
      </div>
    </section>
  );
};

// Mengoptimalkan komponen dengan React.memo karena ini adalah komponen statis
export default React.memo(Contact);