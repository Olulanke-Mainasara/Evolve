/** Story copy, photo credits and sources. Every claim here was fact-checked on 2026-09-15; keep sources in sync when editing. */

export interface Source {
  label: string
  url: string
}

export interface Photo {
  /** Basename in src/assets/chapters/ (converted to .avif and .webp). */
  file: string
  alt: string
  caption?: string
  credit: string
  licence: string
  licenceUrl: string
  /** Wikimedia Commons file page. */
  sourceUrl: string
  /** CC BY-SA crops stay under the same licence and must be marked as changed. */
  cropped: boolean
}

export interface Exhibit {
  title: string
  text: string
  photo?: Photo
}

export interface Chapter {
  id: string
  number: string
  place: string
  period: string
  headline: string
  lede: string
  /** Million years ago, shown by the fixed counter while the chapter is on screen. */
  counter: { from: number; to: number }
  /** 'black' chapters sit on pure black in both themes; 'theme' follows Day / Night. */
  ground: 'black' | 'theme'
  photos: Photo[]
  exhibits?: Exhibit[]
  /** A second beat inside the same chapter (the survivors after the impact). */
  aftermath?: { headline: string; lede: string }
  closing?: string
  sources: Source[]
}

const CC_BY_2 = { licence: 'CC BY 2.0', licenceUrl: 'https://creativecommons.org/licenses/by/2.0/' }
const CC_BY_4 = { licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' }
const CC_BY_SA_3 = { licence: 'CC BY-SA 3.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' }
const CC_BY_SA_4 = { licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`

export const CHAPTERS: Chapter[] = [
  {
    id: 'origins',
    number: '01',
    place: 'Argentina',
    period: 'Late Triassic',
    headline: 'It starts 230 million years ago.',
    lede: 'The first dinosaurs were probably small, two-legged hunters, like Eoraptor from Argentina: about a metre long and 10 kg. Nothing about them said future owners of the sky.',
    counter: { from: 230, to: 230 },
    ground: 'black',
    photos: [],
    sources: [
      { label: 'Natural History Museum: Where did dinosaurs come from?', url: 'https://www.nhm.ac.uk/discover/where-did-dinosaurs-come-from.html' },
      { label: 'Wikipedia: Dinosaur', url: 'https://en.wikipedia.org/wiki/Dinosaur' },
    ],
  },
  {
    id: 'family-tree',
    number: '02',
    place: 'The family tree',
    period: 'Triassic to today',
    headline: 'T. rex is closer kin to a sparrow than to Stegosaurus.',
    lede: 'Birds grew out of the theropods, the same group as T. rex and Velociraptor. Stegosaurus sits on a far branch, and lived more than 80 million years before T. rex. That’s a wider gap than the one between T. rex and you.',
    counter: { from: 230, to: 150 },
    ground: 'theme',
    photos: [],
    sources: [
      { label: 'ScienceDaily: T. rex bone tissue (theropods include birds)', url: 'https://www.sciencedaily.com/releases/2005/06/050602173113.htm' },
      // Popular source for the T. rex / Stegosaurus time gap; replace with a museum page before launch.
      { label: 'Discovery: The Stegosaurus was an ancient relic to the T. rex', url: 'https://www.discovery.com/nature/Stegosaurus-Was-An-Ancient-Relic-TRex' },
    ],
  },
  {
    id: 'archaeopteryx',
    number: '03',
    place: 'Bavaria, Germany',
    period: 'Late Jurassic',
    headline: 'Two years after Darwin, a stone split open.',
    lede: 'In 1861 a limestone quarry in Bavaria gave up Archaeopteryx. It had teeth, clawed fingers and a long bony tail like a small raptor, and wings covered in flight feathers.',
    counter: { from: 150, to: 150 },
    ground: 'theme',
    photos: [
      {
        file: 'archaeopteryx-berlin',
        alt: 'The Berlin Archaeopteryx fossil: a bird-like skeleton with outspread feathered wings pressed into pale limestone',
        caption: 'The Berlin specimen, found in the 1870s.',
        credit: 'Emily Willoughby',
        ...CC_BY_SA_4,
        sourceUrl: commons('Berlin Archaeopteryx.jpg'),
        cropped: false,
      },
      {
        file: 'archaeopteryx-wing',
        alt: 'Close-up of an Archaeopteryx wing, each flight feather printed in the stone',
        credit: 'Emily Willoughby',
        ...CC_BY_SA_4,
        sourceUrl: commons('Berlin Archaeopteryx - detail of arm.jpg'),
        cropped: false,
      },
    ],
    sources: [
      { label: 'Earth Magazine: Archaeopteryx is discovered and described', url: 'https://www.earthmagazine.org/article/benchmarks-september-30-1861-archaeopteryx-discovered-and-described/' },
      { label: 'Britannica: Archaeopteryx', url: 'https://www.britannica.com/animal/Archaeopteryx' },
    ],
  },
  {
    id: 'feathers',
    number: '04',
    place: 'Liaoning, China',
    period: 'Early Cretaceous',
    headline: 'Feathers came before flight.',
    lede: 'In 1996 a farmer in Liaoning, China, found a small dinosaur covered in fuzz. Pigment cells in the fossil show Sinosauropteryx had a striped tail, reddish-brown and white. It couldn’t fly, and neither could Yutyrannus, a 1.4-tonne feathered tyrannosaur from the same region.',
    counter: { from: 125, to: 125 },
    ground: 'theme',
    photos: [
      {
        file: 'sinosauropteryx-tail',
        alt: 'Close-up of a fossil tail with dark bands of preserved feather pigment along the bones',
        caption: 'Its tail, banded with pigment.',
        credit: 'Fiann M. Smithwick, Robert Nicholls, Innes C. Cuthill and Jakob Vinther',
        ...CC_BY_4,
        sourceUrl: commons('Sinosauropteryx plumage fossils.jpg'),
        cropped: true,
      },
      {
        file: 'sinosauropteryx-holotype',
        alt: 'The Sinosauropteryx fossil: a small curled skeleton with a fringe of fuzz along its neck and back',
        caption: 'Sinosauropteryx, the original fossil.',
        credit: 'James St. John',
        ...CC_BY_2,
        sourceUrl: commons('Sinosauropteryx prima feathered dinosaur (Yixian Formation, Lower Cretaceous; Sihetun Quarry, Liaoning Province, northeastern China) (15189586090).jpg'),
        cropped: false,
      },
    ],
    sources: [
      { label: 'Australian Museum: Sinosauropteryx prima', url: 'https://australian.museum/learn/dinosaurs/fact-sheets/sinosauropteryx-prima/' },
      { label: 'Wikipedia: Sinosauropteryx', url: 'https://en.wikipedia.org/wiki/Sinosauropteryx' },
      { label: 'AMNH: Yutyrannus huali', url: 'https://www.amnh.org/explore/news-blogs/yutyrannus-huali-feathered-tyrannosaur' },
    ],
  },
  {
    id: 'habits',
    number: '05',
    place: 'China · Mongolia · Montana',
    period: 'Cretaceous',
    headline: 'They slept, nested and laid eggs like birds.',
    lede: 'Feathers were only the start. Some fossils catch dinosaurs in the middle of very bird-like habits.',
    counter: { from: 125, to: 68 },
    ground: 'theme',
    photos: [],
    exhibits: [
      {
        title: 'Mei long, China',
        text: 'Curled up asleep with its head tucked in, like a roosting bird. The name means “soundly sleeping dragon”.',
        photo: {
          file: 'mei-long',
          alt: 'The Mei long fossil: a small skeleton curled into a tight ball, tail wrapped around its body',
          credit: '纳瓦拉的亨利',
          ...CC_BY_SA_4,
          sourceUrl: commons('Mei long holotype (cropped).jpg'),
          cropped: false,
        },
      },
      {
        title: 'Citipati “Big Mama”, Mongolia',
        text: 'Found in 1993, sitting on her nest with her arms spread over the eggs, the way birds brood.',
        photo: {
          file: 'citipati-big-mama',
          alt: 'The Citipati fossil sitting on a ring of elongated eggs, its arm bones spread around them',
          credit: 'Jonathan Chen',
          ...CC_BY_SA_4,
          sourceUrl: commons('Citipati AMNH.jpg'),
          cropped: false,
        },
      },
      {
        title: 'T. rex, Montana',
        text: 'A 68-million-year-old female. Her leg bone holds medullary bone, a tissue female birds make only when they’re laying eggs.',
      },
    ],
    sources: [
      { label: 'Nature (2004): A new troodontid dinosaur with avian-like sleeping posture', url: 'https://www.nature.com/articles/nature02898' },
      { label: 'AMNH: Citipati osmolskae', url: 'https://www.amnh.org/explore/news-blogs/citipati-osmolskae-dinosaur' },
      { label: 'ScienceDaily (2005): First clue to T. rex gender in bone tissue', url: 'https://www.sciencedaily.com/releases/2005/06/050602173113.htm' },
    ],
  },
  {
    id: 'impact',
    number: '06',
    place: 'Yucatán, Mexico',
    period: 'End of the Cretaceous',
    headline: '66 million years ago, the sky fell.',
    lede: 'An asteroid 10–15 km wide hit what is now Mexico’s Yucatán Peninsula. About three-quarters of all species died, including every dinosaur that wasn’t a bird.',
    counter: { from: 66, to: 66 },
    ground: 'black',
    photos: [
      {
        file: 'kpg-boundary-colorado',
        alt: 'A rock face cut by a dark band of sediment beneath pale sandstone',
        caption: 'The Cretaceous–Paleogene boundary at Trinidad Lake State Park, Colorado.',
        credit: 'Jeffrey Beall',
        ...CC_BY_4,
        sourceUrl: commons('Cretaceous–Paleogene boundary in Colorado 1.JPG'),
        cropped: false,
      },
    ],
    aftermath: {
      headline: 'The small ones made it.',
      lede: 'The forests burned and collapsed, and no tree-dwelling birds survived. The survivors were probably ground birds with toothless beaks that could live on seeds. One close relative is the “Wonderchicken”, a quail-sized bird near the common ancestor of chickens and ducks, which lived less than a million years before the impact.',
    },
    sources: [
      { label: 'PMC: Sulfur and the Chicxulub impact extinction', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11739411/' },
      { label: 'Field Museum (2018): When the dinosaurs died, so did forests', url: 'https://www.fieldmuseum.org/about/press/when-dinosaurs-died-so-did-forests-and-tree-dwelling-birds' },
      { label: 'ScienceDaily (2016): Seeds saved bird ancestors from extinction', url: 'https://www.sciencedaily.com/releases/2016/04/160421133639.htm' },
      { label: 'Science News: Wonderchicken is the earliest known modern bird', url: 'https://www.sciencenews.org/article/wonderchicken-fossil-earliest-known-modern-bird' },
    ],
  },
  {
    id: 'still-here',
    number: '07',
    place: 'Everywhere',
    period: 'Today',
    headline: 'More than 11,000 kinds of dinosaur are still here.',
    lede: 'Birds still carry their past with them. A mutant chicken embryo has grown teeth like a crocodile’s, and blocking two proteins gives chicken embryos a snout instead of a beak.',
    counter: { from: 0, to: 0 },
    ground: 'theme',
    photos: [
      {
        file: 'cassowary',
        alt: 'A southern cassowary: tall horned casque, bright blue neck, red wattles and an orange eye',
        caption: 'A southern cassowary in Papua New Guinea.',
        credit: 'Nick Hobgood',
        ...CC_BY_SA_3,
        sourceUrl: commons('Casuarius casuarius Southern Cassowary Papua New Guinea by Nick Hobgood.jpg'),
        cropped: false,
      },
      {
        file: 'pigeon-peeking',
        alt: 'A grey pigeon peeking over a rock ledge, one red-ringed eye looking straight out',
        credit: 'Manjunath HN',
        ...CC_BY_SA_4,
        sourceUrl: commons('Eye of a rock dove @ Somanathapur Temple.jpg'),
        cropped: false,
      },
    ],
    closing: 'Next time a bird looks at you, a dinosaur is looking back.',
    sources: [
      { label: 'BirdLife: AviList unites the world’s bird species', url: 'https://www.birdlife.org/news/2025/06/11/avilist-unites-the-worlds-bird-species/' },
      { label: 'Current Biology (2006): Archosaurian teeth in a chicken mutant', url: 'https://www.cell.com/current-biology/fulltext/S0960-9822(06)00064-9' },
      { label: 'CBC (2015): Dinosaur-like snouts grown on chicken embryos', url: 'https://www.cbc.ca/news/science/dinosaur-like-snouts-grown-on-chicken-embryos-1.3071434' },
    ],
  },
]
