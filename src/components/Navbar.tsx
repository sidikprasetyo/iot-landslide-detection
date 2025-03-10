"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', String(newDarkMode));
  };
  
  const closeMenu = () => setIsMenuOpen(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Check system preference if no saved preference
    if (localStorage.getItem('darkMode') === null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen && 
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Handle keyboard events for accessibility
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <nav className="z-50 bg-transparent py-6 relative transition-colors duration-300">
      <div className="mx-4 md:mx-8 lg:mx-12 flex justify-between items-center">
        {/* Logo */}
        <div className="navbar-title text-[#007BFF] text-xl md:text-3xl lg:text-4xl font-semibold">
          <Link href="/">Landslide Detection</Link>
        </div>

        {/* Navbar Menu for Desktop */}
        <ul className="navbar-menu hidden md:flex lg:flex md:text-base lg:text-lg md:space-x-2 lg:space-x-4 items-center">
          <li>
            <Link href="/" className="text-[#007BFF] hover:text-[#00C8E6] transition-colors duration-300">Home</Link>
          </li>
          <li>
            <Link href="/dashboard" className="text-[#007BFF] hover:text-[#00C8E6] transition-colors duration-300">Dashboard</Link>
          </li>
          <li>
            <Link href="/about" className="text-[#007BFF]  hover:text-[#00C8E6] transition-colors duration-300">About</Link>
          </li>
          <li>
            <Link href="/contact" className="text-[#007BFF]  hover:text-[#00C8E6] transition-colors duration-300">Contact</Link>
          </li>
          {/* Tombol Dark Mode */}
          <li>
            <button 
              onClick={toggleDarkMode} 
              className="text-[#007BFF]  hover:text-[#00C8E6] mt-2"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </li>
        </ul>

        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden">
          <button 
            ref={buttonRef}
            className="text-[#007BFF]  p-2 rounded-full transition-colors" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu for Mobile */}
      {isMenuOpen && (
        <ul 
          ref={menuRef}
          className="navbar-menu absolute left-0 top-full w-full flex flex-col text-sm bg-[#F8F9FA] dark:bg-[#343A40] shadow-md dark:shadow-gray-800 py-3 space-y-2 md:hidden transition-colors duration-300"
          role="menu"
        >
          <li className="text-center" role="menuitem">
            <Link href="/" className="block text-[#007BFF]  hover:bg-gray-100 dark:hover:bg-gray-800 py-2 transition-colors duration-300" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li className="text-center" role="menuitem">
            <Link href="/dashboard" className="block text-[#007BFF]  hover:bg-gray-100 dark:hover:bg-gray-800 py-2 transition-colors duration-300" onClick={closeMenu}>
              Dashboard
            </Link>
          </li>
          <li className="text-center" role="menuitem">
            <Link href="/about" className="block text-[#007BFF]  hover:bg-gray-100 dark:hover:bg-gray-800 py-2 transition-colors duration-300" onClick={closeMenu}>
              About
            </Link>
          </li>
          <li className="text-center" role="menuitem">
            <Link href="/contact" className="block text-[#007BFF]  hover:bg-gray-100 dark:hover:bg-gray-800 py-2 transition-colors duration-300" onClick={closeMenu}>
              Contact
            </Link>
          </li>
          <li className="text-center flex justify-center items-center" role="menuitem">
            <button 
              onClick={() => { toggleDarkMode(); closeMenu(); }} 
              className="block text-[#007BFF]  hover:bg-gray-100 dark:hover:bg-gray-800 py-2 px-4 rounded transition-colors duration-300 flex items-center"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="ms-2">{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;