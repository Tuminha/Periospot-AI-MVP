import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    periospot: {
      blue: {
        strong: '#15365a',
        mystic: '#003049',
      },
      red: {
        crimson: '#15365a',
        dark: '#669bbc',
      },
      cream: '#669bbc',
      black: '#000000',
      white: '#ffffff',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800',
      },
    },
  },
});

export default theme; 