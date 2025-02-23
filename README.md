# Periospot AI MVP

Periospot AI is a cutting-edge platform designed to assist dental professionals in analyzing scientific literature. The platform leverages artificial intelligence to detect inconsistencies, validate statistical methods, and verify references in dental research papers.

## Features

- **PDF/DOCX Upload**: Support for uploading research papers in PDF or DOCX format
- **Statistical Analysis**: Advanced analysis of research methodologies and statistical validity
- **Reference Validation**: Automatic verification of citations and references
- **Results Verification**: Detection of inconsistencies between results and conclusions
- **Methodology Review**: Evaluation of research methodologies and potential flaws
- **Content Analysis**: Assessment of paper structure and scientific writing quality

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: Supabase
- **AI/ML**: OpenAI API
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Tuminha/Periospot-AI-MVP.git
cd Periospot-AI-MVP
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your configuration values.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Required environment variables are documented in `.env.example`. You'll need to set up:
- Supabase configuration
- OpenAI API key
- PubMed API key
- API URLs and endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Francisco Teixeira Barbosa - [@YourTwitter](https://twitter.com/YourTwitter)
Project Link: [https://github.com/Tuminha/Periospot-AI-MVP](https://github.com/Tuminha/Periospot-AI-MVP)
