import Link from "next/link";

const Footer = () => (
  <footer className="w-full bg-blue-800 text-white mt-10 py-4">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 text-sm md:text-base">
  <div className="mb-2 md:mb-0 font-semibold text-secondary">&copy; {new Date().getFullYear()} Maproflow</div>
    </div>
  </footer>
);

export default Footer;
