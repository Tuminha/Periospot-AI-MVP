"use client";

import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/theme";

export default function RootLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <main className="min-h-screen">
        {children}
      </main>
    </ChakraProvider>
  );
} 