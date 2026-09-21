import { Kavoon, Indie_Flower, Hi_Melody } from "next/font/google";

export const kavoon = Kavoon({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-kavoon'
})

export const indieFlower = Indie_Flower({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-indie',
})

export const hiMelody = Hi_Melody({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-melody',
})
