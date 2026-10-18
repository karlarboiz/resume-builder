export const INDUSTRIES = [
  "Software",
  "Product",
  "Design",
  "Data",
  "Marketing",
  "Finance",
  "Operations",
] as const

export type OnboardingCategory = "Technical" | "Soft" | "Domain"

export const SKILL_SUGGESTIONS: Record<
  string,
  Record<OnboardingCategory, string[]>
> = {
  Software: {
    Technical: [
      "TypeScript",
      "JavaScript",
      "Python",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "GraphQL",
      "Git",
      "Docker",
      "AWS",
      "Testing",
    ],
    Soft: ["Collaboration", "Mentoring", "Written communication", "Ownership"],
    Domain: ["API design", "Accessibility", "Performance", "Web platforms"],
  },
  Product: {
    Technical: ["SQL", "Figma", "Experimentation", "Analytics", "Roadmapping"],
    Soft: ["Stakeholder management", "Facilitation", "Prioritization", "Writing"],
    Domain: ["Discovery", "Pricing", "B2B SaaS", "Lifecycle"],
  },
  Design: {
    Technical: ["Figma", "Prototyping", "Design systems", "HTML", "CSS"],
    Soft: ["Critique", "Collaboration", "Presentation", "Facilitation"],
    Domain: ["User research", "Accessibility", "Visual design", "Content design"],
  },
  Data: {
    Technical: ["SQL", "Python", "dbt", "Dashboards", "Statistics", "Excel"],
    Soft: ["Storytelling", "Stakeholder management", "Curiosity"],
    Domain: ["Experimentation", "Metrics", "Data modeling", "Forecasting"],
  },
  Marketing: {
    Technical: ["Analytics", "SEO", "SQL", "Lifecycle email", "Figma"],
    Soft: ["Writing", "Collaboration", "Presentation"],
    Domain: ["Positioning", "Copywriting", "Demand generation", "Brand"],
  },
  Finance: {
    Technical: ["Excel", "SQL", "Financial modeling", "Forecasting"],
    Soft: ["Attention to detail", "Communication", "Judgment"],
    Domain: ["FP&A", "Accounting", "Audit", "Reporting"],
  },
  Operations: {
    Technical: ["SQL", "Spreadsheets", "Process mapping", "Analytics"],
    Soft: ["Coordination", "Communication", "Prioritization"],
    Domain: ["Vendor management", "Support operations", "Hiring", "Enablement"],
  },
}

const ROLE_TRENDS: { match: RegExp; skills: { name: string; category: "Languages" | "Frameworks" | "Tools" | "Domain" | "Soft" }[] }[] = [
  {
    match: /front|react|ui engineer|web/i,
    skills: [
      { name: "TypeScript", category: "Languages" },
      { name: "React", category: "Frameworks" },
      { name: "Next.js", category: "Frameworks" },
      { name: "Accessibility", category: "Domain" },
      { name: "Testing", category: "Tools" },
    ],
  },
  {
    match: /back|api|platform|node/i,
    skills: [
      { name: "Node.js", category: "Frameworks" },
      { name: "PostgreSQL", category: "Tools" },
      { name: "API design", category: "Domain" },
      { name: "Docker", category: "Tools" },
      { name: "Testing", category: "Tools" },
    ],
  },
  {
    match: /full[\s-]?stack/i,
    skills: [
      { name: "TypeScript", category: "Languages" },
      { name: "React", category: "Frameworks" },
      { name: "PostgreSQL", category: "Tools" },
      { name: "Node.js", category: "Frameworks" },
    ],
  },
  {
    match: /product/i,
    skills: [
      { name: "Roadmapping", category: "Tools" },
      { name: "SQL", category: "Languages" },
      { name: "Experimentation", category: "Domain" },
      { name: "Stakeholder management", category: "Soft" },
      { name: "Discovery", category: "Domain" },
    ],
  },
  {
    match: /design/i,
    skills: [
      { name: "Figma", category: "Tools" },
      { name: "Design systems", category: "Domain" },
      { name: "Prototyping", category: "Tools" },
      { name: "Accessibility", category: "Domain" },
      { name: "User research", category: "Domain" },
    ],
  },
  {
    match: /data|analytics|scientist|machine learning/i,
    skills: [
      { name: "SQL", category: "Languages" },
      { name: "Python", category: "Languages" },
      { name: "Experimentation", category: "Domain" },
      { name: "Dashboards", category: "Tools" },
    ],
  },
  {
    match: /market|growth|brand/i,
    skills: [
      { name: "Positioning", category: "Domain" },
      { name: "Analytics", category: "Tools" },
      { name: "Copywriting", category: "Domain" },
      { name: "SEO", category: "Tools" },
    ],
  },
  {
    match: /financ|account|fp&a/i,
    skills: [
      { name: "Excel", category: "Tools" },
      { name: "Financial modeling", category: "Domain" },
      { name: "SQL", category: "Languages" },
      { name: "Forecasting", category: "Domain" },
    ],
  },
]

export function missingSkills(targetJobs: string[], currentNames: string[]) {
  const have = new Set(currentNames.map((name) => name.toLowerCase()))
  const found = new Map<string, (typeof ROLE_TRENDS)[number]["skills"][number]>()
  for (const job of targetJobs) {
    for (const trend of ROLE_TRENDS) {
      if (!trend.match.test(job)) continue
      for (const skill of trend.skills) {
        if (!have.has(skill.name.toLowerCase())) found.set(skill.name.toLowerCase(), skill)
      }
    }
  }
  return [...found.values()]
}

export function roleSuggestions(industry: string) {
  const map: Record<string, string[]> = {
    Software: ["Senior Frontend Engineer", "Backend Engineer", "Full Stack Engineer"],
    Product: ["Product Manager", "Technical Product Manager"],
    Design: ["Product Designer", "Design Systems Designer"],
    Data: ["Data Analyst", "Analytics Engineer"],
    Marketing: ["Product Marketing Manager", "Growth Marketer"],
    Finance: ["Financial Analyst", "FP&A Analyst"],
    Operations: ["Operations Manager", "Program Manager"],
  }
  return map[industry] ?? ["Product Manager", "Software Engineer"]
}
