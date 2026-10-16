import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { User } from './models/user.model.js';
import { Company } from './models/company.models.js';
import { Job } from './models/job.models.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// SVG helpers to create crisp, recognizable vector logos for each MNC
const svgLogos = {
  Google: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#ffffff"/>
    <path d="M152 101.9c0-3.6-.3-7.1-.9-10.4H102v19.7h28c-1.2 6.5-4.8 12-10.2 15.6v13h16.5c9.7-8.9 15.7-22 15.7-37.9z" fill="#4285F4"/>
    <path d="M102 153c14.3 0 26.3-4.7 35.1-12.8l-16.5-13c-4.7 3.2-10.8 5.1-18.6 5.1-14.3 0-26.4-9.6-30.8-22.6H14.1v13.4C22.8 140.4 59.8 153 102 153z" fill="#34A853"/>
    <path d="M71.2 109.7c-1.1-3.2-1.8-6.6-1.8-10.2s.7-7 1.8-10.2V75.9H14.1C10.5 83 8.5 91 8.5 99.5s2 16.5 5.6 23.6l57.1-13.4z" fill="#FBBC05"/>
    <path d="M102 46.5c7.8 0 14.8 2.7 20.3 7.9l15.2-15.2C128.3 30.8 116.3 26 102 26 59.8 26 22.8 38.6 14.1 66.1l57.1 13.4c4.4-13 16.5-22.6 30.8-22.6z" fill="#EA4335"/>
  </svg>`,

  Microsoft: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#ffffff"/>
    <rect x="42" y="42" width="54" height="54" rx="4" fill="#F25022"/>
    <rect x="104" y="42" width="54" height="54" rx="4" fill="#7FBA00"/>
    <rect x="42" y="104" width="54" height="54" rx="4" fill="#00A4EF"/>
    <rect x="104" y="104" width="54" height="54" rx="4" fill="#FFB900"/>
  </svg>`,

  Amazon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#131921"/>
    <text x="100" y="98" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="52" text-anchor="middle" letter-spacing="-1">amazon</text>
    <path d="M48 126c26 18 78 20 104-2" fill="none" stroke="#FF9900" stroke-width="8" stroke-linecap="round"/>
    <path d="M148 116l10 8-12 6c1-5 2-10 2-14z" fill="#FF9900"/>
  </svg>`,

  Apple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#000000"/>
    <path d="M127.3 97.4c.2-18.7 15.3-27.7 16-28.1-8.7-12.7-22.3-14.4-27.1-14.6-11.6-1.2-22.6 6.8-28.5 6.8-5.9 0-15-6.6-24.6-6.4-12.4.2-23.9 7.2-30.3 18.2-12.9 22.3-3.3 55.4 9.2 73.5 6.1 8.9 13.4 18.8 23 18.4 9.3-.4 12.8-6 24.1-6s14.4 6 24.2 5.8c9.9-.2 16.3-9 22.4-17.9 7.1-10.3 10-20.4 10.2-20.9-.3-.1-19.5-7.5-19.7-29.9z" fill="#FFFFFF"/>
    <path d="M117.8 44.2c5.2-6.3 8.7-15.1 7.7-23.9-7.5.3-16.6 5-22 11.3-4.8 5.5-9 14.4-7.8 23 8.4.6 17-4.1 22.1-10.4z" fill="#FFFFFF"/>
  </svg>`,

  Meta: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="metaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0064e0"/>
        <stop offset="100%" stop-color="#0082fb"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="40" fill="#ffffff"/>
    <path d="M149.6 65.4c-9.1 0-18.1 4.5-25 12.8-9.4-10.8-21.7-16.7-34.5-16.7-24 0-43.1 19.3-43.1 43.5 0 24.3 19 43.6 43 43.6 14.1 0 27.2-7 36.1-18.5 8.9 11.5 22 18.5 36.1 18.5 20.3 0 35.8-15.8 35.8-37.5 0-25.7-22-45.7-48.4-45.7zm-59.5 66.8c-14.7 0-26.3-12.4-26.3-27.2 0-14.8 11.6-27.3 26.3-27.3 10.3 0 20 6.6 25.8 17.5-7.1 13.5-16.4 25.7-25.8 37zm59.5 0c-9.4-11.3-18.7-23.5-25.8-37 5.8-10.9 15.5-17.5 25.8-17.5 16.5 0 28.5 13.5 28.5 29.5 0 13.8-10.4 25-28.5 25z" fill="url(#metaGrad)"/>
  </svg>`,

  Netflix: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#141414"/>
    <g transform="translate(68, 38)">
      <path d="M0 0h20v124H0z" fill="#B81D24"/>
      <path d="M44 0h20v124H44z" fill="#B81D24"/>
      <path d="M0 0l44 124h20L20 0z" fill="#E50914"/>
    </g>
  </svg>`,

  Adobe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#FA0F00"/>
    <g transform="translate(38, 42)">
      <polygon points="0,0 38,116 0,116" fill="#FFFFFF"/>
      <polygon points="124,0 86,116 124,116" fill="#FFFFFF"/>
      <polygon points="62,48 93,116 71,116 58,84 41,116 31,116" fill="#FFFFFF"/>
    </g>
  </svg>`,

  NVIDIA: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#1A1A1A"/>
    <path d="M100 48c-32 0-58 23-58 52s26 52 58 52c22 0 41-11 51-28-7 4-15 6-23 6-24 0-44-18-44-39s20-39 44-39c12 0 22 4 30 11-10-9-27-15-46-15zm12 28c-18 0-32 14-32 31s14 31 32 31c9 0 17-4 22-10-3 1-7 2-10 2-13 0-23-10-23-23s10-23 23-23c4 0 7 1 11 2-6-6-14-10-23-10z" fill="#76B900"/>
    <path d="M100 35C58 35 24 64 24 100s34 65 76 65c30 0 56-15 68-38-6 3-13 5-20 5-10 0-20-3-28-9 14 3 29-2 36-12 4-6 6-13 6-21 0-22-20-40-45-40-7 0-14 2-20 5 11-9 26-15 43-15 9 0 17 2 24 5-14-6-30-10-48-10z" fill="#76B900" opacity="0.6"/>
    <text x="100" y="174" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="20" text-anchor="middle" letter-spacing="4">NVIDIA</text>
  </svg>`,

  Salesforce: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#ffffff"/>
    <g transform="translate(25, 40)">
      <path d="M64 12c11-12 28-15 42-7 11-10 27-12 40-5 13 8 19 23 16 38 12 4 20 16 19 29-1 14-11 25-25 27H29C13 94 0 81 0 65c0-14 10-26 24-28 1-13 9-24 21-29 6-2 13-3 19 4z" fill="#00A1E0"/>
      <text x="75" y="65" fill="#FFFFFF" font-family="Georgia, serif" font-weight="bold" font-style="italic" font-size="26" text-anchor="middle">salesforce</text>
    </g>
  </svg>`,

  Uber: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#000000"/>
    <text x="100" y="118" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="700" font-size="52" text-anchor="middle" letter-spacing="-1.5">Uber</text>
  </svg>`,

  Oracle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#C74634"/>
    <g transform="translate(30, 75)">
      <rect x="0" y="0" width="140" height="50" rx="25" fill="none" stroke="#FFFFFF" stroke-width="14"/>
      <text x="70" y="34" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="26" text-anchor="middle" letter-spacing="4">ORACLE</text>
    </g>
  </svg>`,

  Cisco: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#ffffff"/>
    <g fill="#049FD9" transform="translate(42, 45)">
      <rect x="0" y="36" width="8" height="24" rx="4"/>
      <rect x="14" y="20" width="8" height="40" rx="4"/>
      <rect x="28" y="4" width="8" height="56" rx="4"/>
      <rect x="42" y="20" width="8" height="40" rx="4"/>
      <rect x="56" y="36" width="8" height="24" rx="4"/>
      <rect x="70" y="20" width="8" height="40" rx="4"/>
      <rect x="84" y="4" width="8" height="56" rx="4"/>
      <rect x="98" y="20" width="8" height="40" rx="4"/>
      <rect x="112" y="36" width="8" height="24" rx="4"/>
    </g>
    <text x="100" y="148" fill="#049FD9" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" text-anchor="middle" letter-spacing="3">CISCO</text>
  </svg>`,

  GoldmanSachs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#7399C6"/>
    <text x="100" y="88" fill="#FFFFFF" font-family="'Times New Roman', serif" font-weight="bold" font-size="34" text-anchor="middle">Goldman</text>
    <text x="100" y="128" fill="#FFFFFF" font-family="'Times New Roman', serif" font-weight="bold" font-size="34" text-anchor="middle">Sachs</text>
  </svg>`,

  MorganStanley: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#002D62"/>
    <text x="100" y="90" fill="#FFFFFF" font-family="'Times New Roman', serif" font-weight="bold" font-size="28" text-anchor="middle">Morgan</text>
    <text x="100" y="126" fill="#FFFFFF" font-family="'Times New Roman', serif" font-weight="bold" font-size="28" text-anchor="middle">Stanley</text>
  </svg>`,

  Intel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="#0068B5"/>
    <text x="100" y="118" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="900" font-size="54" text-anchor="middle" letter-spacing="-1">intel</text>
    <circle cx="68" cy="66" r="6" fill="#00C7FD"/>
  </svg>`
};

async function uploadLogo(svgContent, publicId) {
  try {
    const base64 = Buffer.from(svgContent).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64}`;
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: 'company_logos',
      public_id: publicId,
      overwrite: true,
      resource_type: 'image'
    });
    return res.secure_url;
  } catch (err) {
    console.error(`Failed to upload ${publicId} to Cloudinary, fallback to data URI:`, err.message);
    const base64 = Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

const companiesData = [
  {
    companyKey: 'Google',
    companyName: 'Google',
    description: "Google is a global technology leader focused on improving the ways people connect with information. Google's innovations in search, Android, YouTube, Cloud, and Gemini AI have shaped how billions interact with technology every single day.",
    website: 'https://careers.google.com',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Staff Software Engineer - Cloud & Distributed Systems',
      description: `## About Google Cloud Platform (GCP)
Google Cloud provides organizations with leading infrastructure, platform capabilities, and industry solutions. We deliver enterprise-grade cloud solutions that leverage Google's cutting-edge technology to help companies operate more efficiently and adapt to changing needs.

### What You'll Do
- Architect, build, and maintain mission-critical distributed systems and planetary-scale microservices.
- Lead system design reviews, scalability bottlenecks resolution, and fault-tolerance hardening.
- Collaborate with cross-functional engineering teams across Mountain View, Zurich, and Bengaluru.
- Drive adoption of modern cloud-native standards (Kubernetes, gRPC, service meshes).

### Minimum Qualifications
- Bachelor's or Master's degree in Computer Science, related technical field, or equivalent practical experience.
- 5+ years of experience with software development in Go, Java, C++, or Python.
- Proven track record with large-scale distributed systems, consensus algorithms (Raft/Paxos), and high availability.
- Deep expertise in database architectures (Spanner, Bigtable, PostgreSQL).

### Preferred Qualifications
- Experience leading architectural roadmaps for multi-region cloud services.
- Contributions to open-source cloud native projects (Kubernetes, Envoy, Istio).
- Strong understanding of observability, profiling, and low-latency system tuning.

### What Google Offers
- Industry-leading compensation with generous equity grants (GSUs) and annual bonuses.
- Comprehensive family health insurance and wellness benefits.
- Flexible hybrid working model and modern campus amenities.`,
      requirements: ['Go', 'Distributed Systems', 'Kubernetes', 'gRPC', 'Microservices', 'System Design', 'Cloud Architecture'],
      salary: 78,
      experienceLevel: 5,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 12
    }
  },
  {
    companyKey: 'Microsoft',
    companyName: 'Microsoft',
    description: 'Microsoft empowers every person and every organization on the planet to achieve more. Through Azure, Microsoft 365, GitHub, and pioneering AI copilot experiences, Microsoft leads global enterprise cloud transformation.',
    website: 'https://careers.microsoft.com',
    location: 'Hyderabad, Telangana, India',
    job: {
      title: 'Senior Software Engineer - Azure & Core Infrastructure',
      description: `## About Microsoft Azure Engineering
Azure is an ever-expanding set of cloud computing services to help your organization meet its business challenges. Azure gives you the freedom to build, manage, and deploy applications on a massive, global network using your favorite tools and frameworks.

### What You'll Do
- Design, implement, and operate ultra-reliable microservices powering Azure compute and network fabrics.
- Solve deep distributed systems problems including high-throughput request routing and live service updates.
- Work closely with customers and product managers to deliver enterprise-grade SLAs.
- Mentor junior and mid-level engineers, fostering engineering excellence.

### Minimum Qualifications
- 4+ years of professional software engineering experience in C#, Go, Java, or C++.
- Solid grounding in data structures, algorithms, and asynchronous programming.
- Experience building and deploying containerized applications on Azure Kubernetes Service (AKS) or Docker.
- Strong knowledge of relational and NoSQL databases (Cosmos DB, SQL Server).

### Preferred Qualifications
- Experience with infrastructure as code (Terraform, Bicep) and CI/CD pipelines in Azure DevOps / GitHub Actions.
- Prior experience working on hyper-scale infrastructure.
- Excellent communication and technical leadership skills.

### What Microsoft Offers
- Competitive base pay, performance bonuses, and Microsoft stock awards.
- World-class healthcare coverage, fitness allowances, and tuition reimbursement.
- Modern IDC campuses in Hyderabad and Bengaluru with hybrid workplace flexibility.`,
      requirements: ['C#', '.NET Core', 'Azure', 'Distributed Systems', 'Microservices', 'Docker', 'Kubernetes', 'CosmosDB'],
      salary: 65,
      experienceLevel: 4,
      location: 'Hyderabad, Telangana',
      jobType: 'Full Time',
      position: 15
    }
  },
  {
    companyKey: 'Amazon',
    companyName: 'Amazon',
    description: "Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking. Amazon Web Services (AWS) is the world's most comprehensive and broadly adopted cloud platform.",
    website: 'https://www.amazon.jobs',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Software Development Engineer II (SDE-2) - AWS',
      description: `## About Amazon Web Services (AWS)
AWS provides highly reliable, scalable, low-cost infrastructure platform in the cloud that powers hundreds of thousands of businesses in 190 countries around the world.

### What You'll Do
- Take ownership of end-to-end architecture for highly scalable, tier-1 AWS distributed services.
- Translate business requirements into robust, secure, and performant technical designs.
- Drive operational excellence by monitoring performance metrics, alarming, and continuous deployment.
- Champion code quality, unit testing, and automated integration testing.

### Minimum Qualifications
- Bachelor's or Master's degree in Computer Science or related discipline.
- 3+ years of non-internship professional software development experience.
- Strong command of Java, C++, or Go, with mastery of object-oriented design and design patterns.
- Experience with database systems (DynamoDB, Aurora, Redis) and distributed caching.

### Preferred Qualifications
- Hands-on experience developing services on AWS (Lambda, ECS, SQS, SNS, S3, IAM).
- Experience handling massive concurrency and high throughput transactions.
- Track record of delivering high impact systems independently.

### What Amazon Offers
- Comprehensive compensation including base salary, sign-on bonuses, and Amazon RSUs.
- Full medical insurance, parental leave, and international relocation support.
- Accelerated career progression pathways across global AWS engineering organizations.`,
      requirements: ['Java', 'AWS', 'DynamoDB', 'System Design', 'Microservices', 'Distributed Caching', 'CI/CD', 'Spring Boot'],
      salary: 58,
      experienceLevel: 3,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 20
    }
  },
  {
    companyKey: 'Apple',
    companyName: 'Apple',
    description: "Apple creates products that revolutionize personal computing, mobile communication, and digital entertainment. Apple's hardware, software, and services are designed to enrich people's lives and push the boundaries of what is possible.",
    website: 'https://www.apple.com/careers',
    location: 'Hyderabad, Telangana, India',
    job: {
      title: 'Machine Learning Engineer - Siri & Core ML',
      description: `## About Apple Machine Learning & AI
Join the team that creates intelligent experiences across iOS, macOS, watchOS, and visionOS. We are researching and deploying state-of-the-art machine learning models directly to over two billion active Apple devices worldwide.

### What You'll Do
- Train, fine-tune, and optimize deep neural networks and Transformer architectures for on-device inference.
- Optimize machine learning pipelines for power efficiency, memory footprint, and low-latency response.
- Collaborate with privacy and security teams to uphold Apple's industry-leading privacy standards.
- Publish research and translate groundbreaking findings into everyday product features.

### Minimum Qualifications
- Master's or PhD degree in Computer Science, Machine Learning, or related field.
- 4+ years of hands-on experience training ML/DL models with PyTorch, TensorFlow, or JAX.
- Strong proficiency in Python and C++ with experience in model quantization and pruning.
- Deep understanding of NLP, speech recognition, or generative AI fundamentals.

### Preferred Qualifications
- Experience with Apple Core ML, Metal Performance Shaders (MPS), or on-device acceleration.
- Published papers in premier conferences (NeurIPS, ICML, ACL, CVPR).
- Passion for crafting delightful, privacy-centric user experiences.

### What Apple Offers
- Highly competitive compensation package including Apple RSUs and comprehensive bonuses.
- Comprehensive health, wellness, and mental health programs.
- Dynamic, innovation-driven culture on Apple's state-of-the-art India engineering campus.`,
      requirements: ['Python', 'PyTorch', 'NLP', 'Core ML', 'Deep Learning', 'C++', 'Transformer Models', 'Large Language Models'],
      salary: 72,
      experienceLevel: 4,
      location: 'Hyderabad, Telangana',
      jobType: 'Full Time',
      position: 8
    }
  },
  {
    companyKey: 'Meta',
    companyName: 'Meta',
    description: 'Meta builds technologies that help people connect, find communities, and grow businesses. Moving beyond 2D screens, Meta is pioneering immersive experiences in VR, AR, and AI with LLaMA and next-generation social platforms.',
    website: 'https://www.metacareers.com',
    location: 'Gurugram, Haryana, India',
    job: {
      title: 'Frontend Infrastructure Engineer - React & Web Platform',
      description: `## About Meta Web Platform Team
Meta's web applications are used by over 3 billion people worldwide. The Web Platform team creates the foundational libraries, compiler tools, state managers, and runtime infrastructure that power Facebook, Instagram, WhatsApp Web, and Threads.

### What You'll Do
- Develop and optimize the core React ecosystem, build pipelines, and client runtime performance.
- Profile and improve web vital metrics (INP, LCP, CLS) across millions of page views per second.
- Design TypeScript architectures and reusable component libraries with world-class accessibility (a11y).
- Partner with product teams to enable rapid iteration without sacrificing bundle size or rendering efficiency.

### Minimum Qualifications
- 4+ years of software development experience specializing in modern JavaScript and TypeScript.
- Expert-level understanding of React internals, virtual DOM reconciliation, and Concurrent Mode.
- Deep knowledge of browser rendering pipelines, Web Workers, memory profiling, and network optimization.
- Experience with GraphQL, Relay, or Apollo Client architectures.

### Preferred Qualifications
- Core contributions to popular open-source JavaScript/React frameworks or tooling.
- Experience with WebAssembly (Wasm) and edge rendering paradigms.
- Exceptional code review standards and design system leadership.

### What Meta Offers
- Top-of-market compensation with quarterly equity vesting (Meta RSUs).
- Industry-leading health benefits, parental leave, and generous annual wellness stipends.
- Flexible hybrid work schedule with modern collaboration hubs.`,
      requirements: ['React', 'JavaScript', 'TypeScript', 'Web Performance', 'GraphQL', 'WebAssembly', 'Webpack', 'Vite'],
      salary: 68,
      experienceLevel: 4,
      location: 'Gurugram, Haryana',
      jobType: 'Full Time',
      position: 10
    }
  },
  {
    companyKey: 'Netflix',
    companyName: 'Netflix',
    description: "Netflix is one of the world's leading entertainment services with over 260 million paid memberships. We are dedicated to providing seamless, ultra-high-definition streaming, personalized recommendation engines, and world-class studio production tooling.",
    website: 'https://jobs.netflix.com',
    location: 'Mumbai, Maharashtra, India',
    job: {
      title: 'Senior Full Stack Engineer - Streaming Content Platform',
      description: `## About Content Engineering at Netflix
Content Engineering at Netflix builds the systems that manage the entire lifecycle of movies and shows — from script pitching and shooting to localization, encoding, and global streaming.

### What You'll Do
- Architect and develop high-throughput full stack applications for global content distribution.
- Design responsive, intuitive user interfaces in React alongside bulletproof backend microservices in Node.js / Java.
- Manage event-driven pipelines using Apache Kafka for real-time video asset processing.
- Take complete ownership of services from conception to production deployment and monitoring.

### Minimum Qualifications
- 5+ years of full stack engineering experience building resilient production web platforms.
- Mastery of modern JavaScript/TypeScript, React, Node.js, and REST/GraphQL APIs.
- Deep understanding of distributed caching, SQL, and NoSQL databases.
- Strong experience with automated CI/CD pipelines, containerization (Docker), and cloud services.

### Preferred Qualifications
- Experience with streaming protocols (HLS, DASH), video transcoding workflows, or media delivery.
- Prior experience working in high-freedom, high-responsibility engineering environments.
- Passion for film, entertainment, and stellar developer experience.

### What Netflix Offers
- Top-of-market top-tier all-cash or equity-flexible compensation structure.
- Open vacation policy, full health insurance, and comprehensive family leave.
- 100% remote-first flexibility with travel support for team summits.`,
      requirements: ['Node.js', 'React', 'TypeScript', 'GraphQL', 'Kafka', 'AWS', 'High Concurrency', 'System Architecture'],
      salary: 82,
      experienceLevel: 5,
      location: 'Mumbai, Maharashtra',
      jobType: 'Remote',
      position: 6
    }
  },
  {
    companyKey: 'Adobe',
    companyName: 'Adobe',
    description: 'Adobe is the global leader in digital media and digital marketing software. Products like Photoshop, Illustrator, Premiere Pro, Acrobat, and Adobe Experience Cloud empower creators and businesses worldwide.',
    website: 'https://www.adobe.com/careers.html',
    location: 'Noida, Uttar Pradesh, India',
    job: {
      title: 'Senior UI/UX & Design Technologist - Creative Cloud',
      description: `## About Adobe Creative Cloud Design Technologists
We bridge the gap between creative design and cutting-edge web engineering. Our team builds the interactive canvas experiences, vector tooling, and AI-assisted editing workflows inside Adobe Creative Cloud Web.

### What You'll Do
- Build next-generation browser-based vector and raster canvas tools using WebGL and Canvas API.
- Translate Figma prototypes and design systems into reusable, pixel-perfect React components.
- Collaborate closely with UX researchers, product managers, and Firefly GenAI teams.
- Optimize rendering performance for 60fps interaction on large canvas documents.

### Minimum Qualifications
- 3+ years of professional experience in frontend development and interactive UI engineering.
- Proficiency with React, TypeScript, modern CSS (Tailwind CSS, CSS-in-JS), and Web APIs.
- Strong intuition for visual design, micro-interactions, typography, and motion aesthetics.
- Familiarity with HTML5 Canvas, SVG manipulation, or WebGL shaders.

### Preferred Qualifications
- Active Figma plugin or design system contribution history.
- Experience building creative software, photo/video editors, or CAD web applications.
- Strong portfolio demonstrating both technical capability and design sensibility.

### What Adobe Offers
- Lucrative compensation package including Adobe stock (RSUs) and performance bonuses.
- Annual education and wellness reimbursement, health insurance for dependents.
- Vibrant Noida and Bengaluru innovation campuses with flexible hybrid arrangements.`,
      requirements: ['UI/UX Design', 'Figma', 'Design Systems', 'React', 'TypeScript', 'Tailwind CSS', 'Canvas API', 'WebGL'],
      salary: 52,
      experienceLevel: 3,
      location: 'Noida, Uttar Pradesh',
      jobType: 'Hybrid',
      position: 7
    }
  },
  {
    companyKey: 'NVIDIA',
    companyName: 'NVIDIA',
    description: "NVIDIA is the pioneer of GPU computing and the engine behind the global artificial intelligence revolution. From DGX SuperPODs to CUDA and Omniverse, NVIDIA's technologies power modern AI, supercomputing, and graphics.",
    website: 'https://www.nvidia.com/en-us/about-nvidia/careers',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'AI Systems & Deep Learning Performance Engineer',
      description: `## About NVIDIA AI Systems Engineering
Join the team at the center of the AI revolution. We engineer the core software stack connecting cutting-edge GPU hardware (Blackwell, Hopper) to modern deep learning frameworks used by the world's leading AI labs.

### What You'll Do
- Optimize distributed training and inference performance for trillion-parameter LLMs and generative AI.
- Write high-performance CUDA kernels, C++ acceleration libraries, and TensorRT plugins.
- Profile and eradicate communication bottlenecks in multi-GPU, multi-node InfiniBand clusters.
- Collaborate with AI researchers to deploy breakthrough models with maximum hardware utilization.

### Minimum Qualifications
- 5+ years of software development experience with expert-level C++ and Python.
- Proven mastery of CUDA programming, GPU architecture, and memory hierarchy.
- Deep familiarity with deep learning frameworks (PyTorch, Megatron-LM, vLLM).
- Experience with parallel programming models (MPI, OpenMP, NCCL).

### Preferred Qualifications
- Master's or PhD degree in Computer Science, Electrical Engineering, or related technical field.
- Track record of optimizing transformer models for real-time production inference.
- Strong publications or open-source contributions in HPC or machine learning systems.

### What NVIDIA Offers
- Top-of-tier compensation including high-value NVIDIA stock grants (ESPP and RSUs).
- Comprehensive healthcare benefits, sabbatical leave, and continuous learning programs.
- Opportunity to work directly on the world's most powerful AI supercomputers.`,
      requirements: ['CUDA', 'C++', 'PyTorch', 'GPU Acceleration', 'High Performance Computing', 'TensorRT', 'Distributed Training'],
      salary: 85,
      experienceLevel: 5,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 14
    }
  },
  {
    companyKey: 'Salesforce',
    companyName: 'Salesforce',
    description: 'Salesforce is the global CRM leader, empowering companies to connect with their customers through cloud, mobile, social, and AI technologies. Hyperforce delivers Salesforce Customer 360 securely on major public clouds.',
    website: 'https://www.salesforce.com/company/careers',
    location: 'Hyderabad, Telangana, India',
    job: {
      title: 'Lead Backend Engineer - Hyperforce Distributed Services',
      description: `## About Salesforce Hyperforce
Hyperforce is the next-generation architecture of Salesforce, enabling Customer 360 applications to run globally on public cloud infrastructure with zero downtime and ironclad compliance.

### What You'll Do
- Architect and develop mission-critical distributed services handling billions of daily customer API requests.
- Build resilient asynchronous messaging architectures using Apache Kafka and RabbitMQ.
- Ensure strict multi-tenant isolation, data encryption, and zero-trust security postures.
- Mentor a talented squad of software engineers, upholding high standards of design and testing.

### Minimum Qualifications
- 5+ years of experience designing and developing enterprise-scale backend applications in Java.
- Strong command of Spring Boot, microservices architecture, and RESTful API design.
- Deep expertise in relational databases (PostgreSQL, Oracle) and caching solutions (Redis).
- Hands-on experience with Kubernetes, Docker, and AWS/GCP cloud environments.

### Preferred Qualifications
- Experience in multi-tenant SaaS architectures and database sharding.
- Knowledge of observability tools (Prometheus, Grafana, OpenTelemetry).
- Excellent technical communication and cross-functional leadership skills.

### What Salesforce Offers
- Competitive compensation, annual performance bonuses, and Salesforce RSUs.
- 7 days of paid volunteer time off (VTO) per year, wellness reimbursement, and full family healthcare.
- Hybrid working environment at the iconic Salesforce Tower Hyderabad.`,
      requirements: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'PostgreSQL', 'Redis', 'Kubernetes', 'AWS'],
      salary: 60,
      experienceLevel: 5,
      location: 'Hyderabad, Telangana',
      jobType: 'Hybrid',
      position: 12
    }
  },
  {
    companyKey: 'Uber',
    companyName: 'Uber',
    description: 'Uber develops innovative mobility and delivery platforms that connect riders with drivers, eaters with restaurants, and shippers with carriers in more than 10,000 cities worldwide.',
    website: 'https://www.uber.com/us/en/careers',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Staff Platform Engineer - Mobility & Real-Time Dispatch',
      description: `## About Uber Marketplace & Dispatch
The Marketplace engineering team is the brain of Uber. We solve real-time marketplace dynamics: matching riders with drivers, dynamic pricing, geospatial routing, and driver dispatching in sub-second latency.

### What You'll Do
- Architect ultra-low latency dispatching engines that process hundreds of thousands of concurrent trip requests.
- Build highly available stateful distributed systems in Go and Java with 99.999% uptime.
- Design spatial indexing algorithms (H3) and real-time streaming pipelines over Apache Kafka and Flink.
- Lead multi-quarter technical initiatives spanning teams across Bengaluru, Amsterdam, and San Francisco.

### Minimum Qualifications
- 6+ years of production experience in backend software engineering with Go, Java, or C++.
- Deep expertise in distributed systems, consistency models, and partition tolerance.
- Experience with high-throughput NoSQL datastores (Cassandra, ScyllaDB) and distributed caches.
- Proven track record of architecting mission-critical platforms with rigorous failover strategies.

### Preferred Qualifications
- Experience with geospatial databases and spatial indexing systems (H3, S2, PostGIS).
- Passion for solving real-world marketplace efficiency and logistics problems.
- Track record of mentoring senior engineers and leading architectural steering groups.

### What Uber Offers
- Industry-leading compensation package including lucrative Uber equity and performance bonuses.
- Subsidized Uber rides, meals, premium health insurance, and flexible time off.
- World-class engineering facilities in Bengaluru with hybrid working autonomy.`,
      requirements: ['Go', 'Java', 'Kafka', 'Cassandra', 'Real-Time Systems', 'Geo-Spatial Algorithms', 'Distributed Consensus'],
      salary: 75,
      experienceLevel: 6,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 9
    }
  },
  {
    companyKey: 'Oracle',
    companyName: 'Oracle',
    description: 'Oracle provides enterprise software, autonomous cloud database systems, and infrastructure services. Oracle Cloud Infrastructure (OCI) delivers high-performance compute, storage, and networking tailored for global enterprises.',
    website: 'https://www.oracle.com/corporate/careers',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Cloud Infrastructure Architect - OCI Database Platforms',
      description: `## About Oracle Cloud Infrastructure (OCI)
OCI is built from the ground up to be an enterprise cloud that delivers higher performance, better security, and greater cost savings for mission-critical enterprise workloads.

### What You'll Do
- Architect and automate infrastructure for Oracle Autonomous Database and Exadata Cloud Services on OCI.
- Build infrastructure-as-code automation using Terraform, Python, and cloud APIs.
- Troubleshoot complex low-level Linux networking, kernel, and storage performance issues.
- Collaborate with enterprise clients to architect disaster recovery and high availability topologies.

### Minimum Qualifications
- 4+ years of experience in cloud infrastructure, systems engineering, or DevOps.
- Strong proficiency in Python, Go, or Bash scripting for automation.
- In-depth understanding of Linux internals, storage subsystems (NVMe, RDMA), and virtualized networking.
- Experience deploying and managing Kubernetes clusters at scale.

### Preferred Qualifications
- In-depth familiarity with Oracle Database technologies or multi-cloud migrations.
- Professional certifications in OCI, AWS, or GCP architecture.
- Strong background in zero-downtime rolling upgrades and automated self-healing systems.

### What Oracle Offers
- Attractive compensation with Oracle stock awards and annual achievement bonuses.
- Comprehensive medical, dental, vision coverage, and parental support.
- Modern IDC campuses in Bengaluru and Hyderabad with rich career mobility opportunities.`,
      requirements: ['OCI', 'Cloud Architecture', 'Linux Internals', 'Terraform', 'Ansible', 'Kubernetes', 'Autonomous Database'],
      salary: 55,
      experienceLevel: 4,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 11
    }
  },
  {
    companyKey: 'Cisco',
    companyName: 'Cisco Systems',
    description: 'Cisco is the worldwide leader in technology that powers the Internet. Cisco provides industry-leading networking, cybersecurity, collaboration, and cloud management solutions across the globe.',
    website: 'https://www.cisco.com/c/en/us/about/careers.html',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Principal Network & Cybersecurity Software Engineer',
      description: `## About Cisco Security & Cloud Networking
Cisco Security defends businesses against sophisticated cyber threats. We build Zero Trust architectures, secure access service edge (SASE) platforms, and next-gen firewalls protecting millions of users.

### What You'll Do
- Design and implement high-performance security software for packet inspection and threat telemetry.
- Develop distributed microservices in Python, C++, and Go for cloud security monitoring.
- Implement cryptographic protocols, mutual TLS, and identity-aware proxy mechanisms.
- Participate in threat modeling, vulnerability assessments, and automated security verification.

### Minimum Qualifications
- 5+ years of software development experience in networking, security, or systems software.
- Strong proficiency in C++ and Python with solid understanding of data structures and multi-threading.
- Comprehensive knowledge of TCP/IP, BGP, DNS, TLS/SSL, and modern network protocols.
- Hands-on experience with container networking (CNI) and Linux kernel packet filtering (eBPF, iptables).

### Preferred Qualifications
- Experience in Zero Trust Network Access (ZTNA) or SD-WAN architectures.
- Certifications such as CISSP, CCIE, or equivalent practical cybersecurity expertise.
- Contributions to networking or security standards and open-source tools.

### What Cisco Offers
- Excellent base compensation, performance bonuses, and Cisco stock grants.
- Comprehensive healthcare covering family members, wellness days, and educational assistance.
- State-of-the-art Cisco campus in Bengaluru with flexible hybrid work arrangements.`,
      requirements: ['Python', 'C++', 'Network Protocols', 'Zero Trust Architecture', 'Cryptographic Security', 'SD-WAN', 'Docker'],
      salary: 62,
      experienceLevel: 5,
      location: 'Bengaluru, Karnataka',
      jobType: 'Hybrid',
      position: 8
    }
  },
  {
    companyKey: 'GoldmanSachs',
    companyName: 'Goldman Sachs',
    description: 'Goldman Sachs is a premier global investment banking, securities, and investment management firm. Its engineering division builds mathematically rigorous software powering global financial markets.',
    website: 'https://www.goldmansachs.com/careers',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Quantitative Software Engineer - Global Trading Systems',
      description: `## About Goldman Sachs Core Engineering
Goldman Sachs engineers solve complex mathematical, algorithmic, and distributed computing challenges to build platforms that execute millions of trades in microsecond timeframes.

### What You'll Do
- Design, build, and optimize high-frequency electronic trading engines and risk management software.
- Write ultra-low latency, concurrent Java and C++ code with zero-garbage collection overhead.
- Partner directly with quantitative strategists, traders, and risk managers on trading desks.
- Implement automated stress-testing frameworks for real-time market risk calculations.

### Minimum Qualifications
- Bachelor's or Master's degree in Computer Science, Mathematics, Electrical Engineering, or related field.
- 3+ years of intensive software development experience in Java or C++.
- Strong command of algorithmic complexity, lock-free data structures, and memory-mapped files.
- Excellent analytical problem-solving and mathematical aptitude.

### Preferred Qualifications
- Familiarity with financial derivatives, equities, or fixed-income market microstructure.
- Knowledge of hardware-software co-design, kernel bypass (Solarflare), or FPGA interfaces.
- Experience with distributed streaming and event sourcing architectures.

### What Goldman Sachs Offers
- Top-tier financial services compensation with lucrative annual performance bonuses.
- Comprehensive family health insurance, on-site health center, and wellness programs.
- Bengaluru office is the largest Goldman Sachs technology hub outside New York.`,
      requirements: ['Java', 'C++', 'Low Latency', 'Algorithms', 'Financial Modeling', 'Data Structures', 'Multi-threading'],
      salary: 70,
      experienceLevel: 3,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 10
    }
  },
  {
    companyKey: 'MorganStanley',
    companyName: 'Morgan Stanley',
    description: 'Morgan Stanley is a global financial services leader providing investment banking, securities, and wealth management services. Morgan Stanley Technology drives innovative cloud, data analytics, and algorithmic trading.',
    website: 'https://www.morganstanley.com/careers',
    location: 'Mumbai, Maharashtra, India',
    job: {
      title: 'Lead Data Engineer - High-Frequency Analytics',
      description: `## About Morgan Stanley Data Platform Engineering
Our data platform team ingests, enriches, and analyzes petabytes of structured and unstructured financial data daily to power risk analysis, client reporting, and algorithmic decisioning.

### What You'll Do
- Design and scale distributed data pipelines processing billions of streaming market events daily.
- Implement robust batch and real-time analytics using Apache Spark, Kafka, and Snowflake.
- Build automated data validation, anomaly detection, and data lineage governance pipelines.
- Modernize on-premise data warehouses towards secure cloud data lakes on AWS and Azure.

### Minimum Qualifications
- 4+ years of data engineering experience with Apache Spark, Hadoop, and distributed query engines.
- Strong programming skills in Python, Scala, or Java, with deep SQL mastery.
- Proven experience architecting data pipelines with Kafka, Airflow, or Databricks.
- Solid understanding of data modeling (star schema, Data Vault) and columnar storage formats (Parquet, Delta).

### Preferred Qualifications
- Experience with cloud data warehousing (Snowflake, BigQuery, Redshift).
- Knowledge of financial datasets (market tick data, corporate actions, trades).
- Strong track record of optimizing distributed query execution plans.

### What Morgan Stanley Offers
- Competitive compensation package, annual discretionary bonuses, and deferred equity.
- Comprehensive medical insurance, retirement plans, and fitness stipends.
- Prime office locations in Mumbai and Bengaluru with collaborative workplace policies.`,
      requirements: ['Apache Spark', 'Python', 'Kafka', 'SQL', 'Snowflake', 'Data Warehousing', 'ETL Pipelines', 'AWS'],
      salary: 56,
      experienceLevel: 4,
      location: 'Mumbai, Maharashtra',
      jobType: 'Full Time',
      position: 12
    }
  },
  {
    companyKey: 'Intel',
    companyName: 'Intel Corporation',
    description: "Intel is an industry leader in semiconductor innovation, creating world-changing technology that advances design and manufacturing of silicon. Intel's processors and accelerators power the world's datacenters and PC ecosystems.",
    website: 'https://jobs.intel.com',
    location: 'Bengaluru, Karnataka, India',
    job: {
      title: 'Embedded Firmware & Low-Level Systems Software Engineer',
      description: `## About Intel Systems & Software Engineering
Intel software engineers optimize the entire hardware-software continuum. We develop UEFI/BIOS firmware, Linux kernel drivers, power management systems, and hardware virtualization layers for next-generation silicon.

### What You'll Do
- Develop and debug low-level embedded firmware in C and Assembly for x86 and ARM processor architectures.
- Implement device drivers, power states (ACPI), and secure boot mechanisms.
- Collaborate with silicon validation teams using JTAG emulators, logic analyzers, and oscilloscopes.
- Optimize hardware-software interfaces for edge computing, AI PC platforms, and server processors.

### Minimum Qualifications
- 3+ years of professional experience in embedded software or firmware development.
- Expert-level proficiency in C and modern C++ for resource-constrained systems.
- Strong understanding of computer architecture (registers, cache coherence, interrupts, DMA).
- Hands-on experience with RTOS (FreeRTOS, Zephyr) or Linux kernel driver development.

### Preferred Qualifications
- In-depth knowledge of UEFI specification, EDK II framework, or coreboot.
- Experience with hardware security protocols (TPM, Secure Boot, Intel SGX).
- Familiarity with PCIe, USB-C, I2C, SPI, and memory controller specifications.

### What Intel Offers
- Competitive base salary, annual profit-sharing bonuses, and Intel stock (RSUs).
- Extensive health coverage, wellness days, and sabbatical benefits.
- State-of-the-art silicon design and validation laboratories in Bengaluru.`,
      requirements: ['C', 'C++', 'Embedded Linux', 'Firmware', 'Device Drivers', 'ARM/x86 Architecture', 'RTOS'],
      salary: 50,
      experienceLevel: 3,
      location: 'Bengaluru, Karnataka',
      jobType: 'Full Time',
      position: 15
    }
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const user = await User.findOne({ email: 'v8381813340@gmail.com' });
    if (!user) {
      throw new Error('Recruiter user v8381813340@gmail.com not found!');
    }
    console.log(`Found recruiter user: ${user.fullname} (${user._id})`);

    const createdCompanies = [];
    const createdJobs = [];

    for (const item of companiesData) {
      console.log(`\nProcessing company: ${item.companyName}...`);
      
      // Upload logo
      const svg = svgLogos[item.companyKey];
      const logoUrl = await uploadLogo(svg, `logo_${item.companyKey.toLowerCase()}`);
      console.log(`Logo URL for ${item.companyName}: ${logoUrl}`);

      // Upsert Company
      let company = await Company.findOne({ companyName: item.companyName });
      if (company) {
        company.description = item.description;
        company.website = item.website;
        company.location = item.location;
        company.logo = logoUrl;
        company.userId = user._id;
        await company.save();
        console.log(`Updated existing company: ${item.companyName} (${company._id})`);
      } else {
        company = await Company.create({
          companyName: item.companyName,
          description: item.description,
          website: item.website,
          location: item.location,
          logo: logoUrl,
          userId: user._id,
        });
        console.log(`Created new company: ${item.companyName} (${company._id})`);
      }
      createdCompanies.push(company);

      // Check if job already exists for this company with same title or create it
      let existingJob = await Job.findOne({
        title: item.job.title,
        company: company._id
      });

      if (existingJob) {
        existingJob.description = item.job.description;
        existingJob.requirements = item.job.requirements;
        existingJob.salary = item.job.salary;
        existingJob.experienceLevel = item.job.experienceLevel;
        existingJob.location = item.job.location;
        existingJob.jobType = item.job.jobType;
        existingJob.position = item.job.position;
        existingJob.created_by = user._id;
        await existingJob.save();
        console.log(`Updated existing job: ${item.job.title} (${existingJob._id})`);
        createdJobs.push(existingJob);
      } else {
        const newJob = await Job.create({
          title: item.job.title,
          description: item.job.description,
          requirements: item.job.requirements,
          salary: item.job.salary,
          experienceLevel: item.job.experienceLevel,
          location: item.job.location,
          jobType: item.job.jobType,
          position: item.job.position,
          company: company._id,
          created_by: user._id,
          applications: [],
        });
        console.log(`Created new job: ${item.job.title} (${newJob._id})`);
        createdJobs.push(newJob);
      }
    }

    console.log('\n=============================================');
    console.log(`SUCCESS! Processed ${createdCompanies.length} MNC companies and ${createdJobs.length} MNC jobs.`);
    console.log('Recruiter email:', user.email);
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
