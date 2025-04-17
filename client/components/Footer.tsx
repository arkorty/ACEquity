import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full mx-auto border-t px-4 py-4 text-center text-sm text-gray-500">
      <p className="mb-1">&copy; {year} ACEquity. All rights reserved.</p>
      {/* Use precomputed year */}
      <Link href="/terms" className="text-blue-500 hover:underline">
        Terms of Service
      </Link>
    </footer>
  );
}
