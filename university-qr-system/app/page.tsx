import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { GraduationCap, ScanLine } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-[#213B94] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">EUI QR VERIFICATION</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1B1F3B] mb-4">
            University QR Code Verification System
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Generate and verify student QR codes for secure identification
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Card className="border-2 hover:border-[#213B94] transition-all">
              <CardHeader className="text-center">
                <div className="mx-auto bg-[#213B94]/10 p-4 rounded-full mb-4">
                  <GraduationCap className="h-10 w-10 text-[#213B94]" />
                </div>
                <CardTitle className="text-xl">Student Portal</CardTitle>
                <CardDescription>
                  Generate your QR code for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p>
                  Register your details and get a unique QR code for
                  identification
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild className="bg-[#213B94] hover:bg-[#213B94]/90">
                  <Link href="/student">Generate QR Code</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-2 hover:border-[#66DE16] transition-all">
              <CardHeader className="text-center">
                <div className="mx-auto bg-[#66DE16]/10 p-4 rounded-full mb-4">
                  <ScanLine className="h-10 w-10 text-[#66DE16]" />
                </div>
                <CardTitle className="text-xl">Admin Portal</CardTitle>
                <CardDescription>
                  Scan and verify student QR codes
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p>
                  Lecturers can login to scan and verify student identification
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  asChild
                  className="bg-[#66DE16] hover:bg-[#66DE16]/90 text-[#1B1F3B]"
                >
                  <Link href="/admin">Admin Login</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-[#213B94] text-white p-6">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} EUI QR VERIFICATION System</p>
        </div>
      </footer>
    </div>
  );
}
