import { motion } from 'framer-motion';
import { ArrowUpRight, Boxes, Code2, ExternalLink, Globe2, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PORTFOLIO_URL = 'https://preetamhegde.in';
const INKWELL_URL = 'https://inkwell.preetamhegde.in';
const REPO_URL = 'https://github.com/Preetam-hegde/system-blueprint';

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function About() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(210_80%_92%/.7),transparent_28%),radial-gradient(circle_at_bottom_right,hsl(28_90%_90%/.65),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(210_20%_98%))] text-foreground dark:bg-[radial-gradient(circle_at_top_left,hsl(217_91%_60%/.18),transparent_24%),radial-gradient(circle_at_85%_18%,hsl(188_95%_55%/.12),transparent_22%),radial-gradient(circle_at_bottom_right,hsl(24_95%_53%/.12),transparent_24%),linear-gradient(180deg,hsl(230_24%_8%),hsl(228_22%_6%))]">
      <div className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[linear-gradient(120deg,hsl(217_91%_60%/.08),transparent_36%,hsl(24_95%_53%/.08))] dark:bg-[linear-gradient(125deg,hsl(217_91%_60%/.16),transparent_34%,hsl(188_95%_55%/.08),transparent_60%,hsl(24_95%_53%/.14))]"
        />
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="pointer-events-none absolute left-[-8%] top-24 h-72 w-72 rounded-full border border-primary/15 bg-primary/5 blur-3xl dark:border-primary/20 dark:bg-primary/12"
        />
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.16 }}
          className="pointer-events-none absolute right-[-6%] top-40 h-80 w-80 rounded-full border border-orange-400/15 bg-orange-400/10 blur-3xl dark:border-orange-400/20 dark:bg-orange-400/14"
        />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
          <motion.header
            custom={0}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className="flex items-center justify-between gap-4"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:hover:border-primary/40"
            >
              <Boxes className="h-4 w-4" />
              System Blueprint
            </Link>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 dark:bg-primary dark:text-primary-foreground"
            >
              Visit Portfolio
              <ExternalLink className="h-4 w-4" />
            </a>
          </motion.header>

          <main className="flex flex-1 items-center py-10 sm:py-14">
            <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
              <section className="space-y-8">
                <motion.div custom={0.08} initial="hidden" animate="visible" variants={reveal}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                    <Code2 className="h-3.5 w-3.5" />
                    About The Builder
                  </div>
                </motion.div>

                <motion.div custom={0.16} initial="hidden" animate="visible" variants={reveal} className="space-y-4">
                  <h1 className="max-w-3xl text-5xl font-black tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
                    Preetam Hegde
                  </h1>
                  <p className="max-w-xl text-xl font-medium text-muted-foreground sm:text-2xl">
                    Building products where software architecture becomes clear, testable, and easy to communicate.
                  </p>
                  <p className="max-w-2xl text-base leading-7 text-foreground/80 dark:text-foreground/78 sm:text-lg">
                    I focus on developer-first experiences: tools that help teams design better systems,
                    reason about trade-offs, and move from whiteboard ideas to practical implementation faster.
                    System Blueprint is one expression of that direction.
                  </p>
                </motion.div>

                <motion.div
                  custom={0.24}
                  initial="hidden"
                  animate="visible"
                  variants={reveal}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.18)] transition-transform hover:-translate-y-0.5 dark:shadow-[0_14px_40px_hsl(217_91%_60%/.22)]"
                  >
                    View Portfolio
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <Link
                    to="/"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:hover:border-primary/40"
                  >
                    Open Workspace
                    <Layers3 className="h-4 w-4" />
                  </Link>
                  <a
                    href={INKWELL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:hover:border-primary/40"
                  >
                    Read Inkwell
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/14 dark:border-primary/30 dark:bg-primary/12 dark:text-primary-foreground"
                  >
                    Star on GitHub
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </motion.div>

                <motion.div
                  custom={0.32}
                  initial="hidden"
                  animate="visible"
                  variants={reveal}
                  className="grid gap-5 border-t border-border/60 pt-8 sm:grid-cols-3"
                >
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Role</div>
                    <div className="text-sm font-medium text-foreground">Preetam Hegde</div>
                    <div className="text-sm text-muted-foreground">Product-focused software developer</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Primary Site</div>
                    <div className="text-sm font-medium text-foreground">preetamhegde.in</div>
                    <div className="text-sm text-muted-foreground">Projects, writing, and professional work</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Writing</div>
                    <div className="text-sm font-medium text-foreground">inkwell.preetamhegde.in</div>
                    <div className="text-sm text-muted-foreground">Long-form notes, essays, and technical writing</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current Focus</div>
                    <div className="text-sm font-medium text-foreground">Architecture tooling</div>
                    <div className="text-sm text-muted-foreground">Simulation, analysis, and design workflow UX</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">GitHub</div>
                    <div className="text-sm font-medium text-foreground">system-blueprint</div>
                    <div className="text-sm text-muted-foreground">Open project for experimentation and iteration</div>
                  </div>
                </motion.div>
              </section>

              <motion.aside
                custom={0.22}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/70 p-6 shadow-[0_24px_90px_hsl(220_40%_12%/.08)] backdrop-blur dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_30px_100px_hsl(220_60%_2%/.45)]"
              >
                <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/60" />
                <div className="space-y-8 pt-4">
                  <div className="space-y-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/14 dark:text-primary-foreground">
                      <Globe2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">How I approach building</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        I care about software that is practical under real load, understandable to teams,
                        and polished enough for day-to-day use.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="border-b border-border/60 pb-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Core strengths</div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/85">
                        <li>Turning complex architecture into clear visual workflows.</li>
                        <li>Designing interfaces that expose meaningful operational controls.</li>
                        <li>Balancing technical depth with product usability.</li>
                        <li>Building iteratively with feedback from real usage.</li>
                      </ul>
                    </div>

                    <div className="border-b border-border/60 pb-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">What System Blueprint is for</div>
                      <p className="mt-3 text-sm leading-6 text-foreground/85">
                        This project helps teams map service dependencies, simulate operational stress,
                        and discuss capacity and reliability decisions with shared context.
                      </p>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Get in touch</div>
                      <p className="mt-3 text-sm leading-6 text-foreground/85">
                        For collaboration, consulting, or product engineering discussions, the best starting point
                        is the portfolio. For writing and longer-form ideas, Inkwell is the better destination.
                        You can also explore the repository to see this work in progress.
                        If this project is useful, please{' '}
                        <a
                          href={REPO_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                          give it a star on GitHub
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
