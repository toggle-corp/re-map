import type { Preview } from "@storybook/react";
import 'maplibre-gl/dist/maplibre-gl.css';

window.global ||= window;

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
