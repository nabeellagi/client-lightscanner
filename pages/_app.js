import "@/styles/globals.css"; // Your global Tailwind v4 file
import { hiMelody, indieFlower, kavoon } from "./fonts";

export default function App({ Component, pageProps }) {
  return (
    <main className={`${kavoon.variable} ${indieFlower.variable} ${hiMelody.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
