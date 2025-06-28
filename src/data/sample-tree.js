export const initialTree = {
  id: "root",
  name: "Main System",
  description: "Central system managing all core features and services",
  useCases: ["System overview", "Core infrastructure", "Feature hierarchy"],
  valueProposition:
    "Provides a structured foundation to organize and extend platform capabilities",
  children: [
    {
      id: "feature-group-a",
      name: "Feature Group A",
      description: "Major functional area A handling user-facing modules",
      useCases: ["User operations", "Frontend features"],
      valueProposition:
        "Organizes all core functionalities directly impacting end-users",
      children: [
        {
          id: "sub-feature-a1",
          name: "Authentication Services",
          description: "Handles login, registration, and identity verification",
          useCases: ["User login", "Secure registration", "Session management"],
          valueProposition:
            "Secures user access and identity across the platform",
          children: [
            {
              id: "component-a1-1",
              name: "Login Handler",
              description: "Manages login forms, tokens, and user validation",
              useCases: ["Email/password login", "OAuth integration"],
              valueProposition:
                "Ensures seamless and secure login for various user types",
              children: [
                {
                  id: "module-a1-1-a",
                  name: "Token Manager",
                  description:
                    "Generates, verifies, and renews authentication tokens",
                  useCases: ["JWT token handling", "Session expiry check"],
                  valueProposition:
                    "Enables stateless authentication and scalability",
                  children: [
                    {
                      id: "unit-a1-1-a-1",
                      name: "Token Generator",
                      description:
                        "Creates signed tokens for valid credentials",
                      useCases: ["Generate JWT", "Set expiration"],
                      valueProposition:
                        "Provides fast, secure access control at scale",
                    },
                    {
                      id: "unit-a1-1-a-2",
                      name: "Token Verifier",
                      description: "Validates tokens on incoming requests",
                      useCases: ["Token parsing", "Signature verification"],
                      valueProposition:
                        "Protects system from unauthorized access",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "sub-feature-a2",
          name: "User Profiles",
          description: "Manages personal data and preferences of users",
          useCases: ["Profile update", "Avatar upload", "Privacy settings"],
          valueProposition:
            "Enhances personalization and user experience through profile management",
        },
      ],
    },
    {
      id: "feature-group-b",
      name: "Feature Group B",
      description: "Handles system-level utilities and background services",
      useCases: ["Automation", "Monitoring", "Backend services"],
      valueProposition:
        "Supports the platform with scalable, reliable backend functionality",
      children: [
        {
          id: "sub-feature-b1",
          name: "Notification Engine",
          description:
            "Distributes messages to users via multiple communication channels",
          useCases: ["Send emails", "Push notifications", "In-app alerts"],
          valueProposition: "Keeps users informed and engaged in real-time",
          children: [
            {
              id: "component-b1-1",
              name: "Email Dispatcher",
              description: "Manages templates and delivery of system emails",
              useCases: [
                "Send welcome email",
                "Password reset",
                "Billing alerts",
              ],
              valueProposition:
                "Automates user communication and improves engagement",
              children: [
                {
                  id: "module-b1-1-a",
                  name: "Template Renderer",
                  description: "Formats emails using dynamic content",
                  useCases: ["Personalize content", "Multilingual support"],
                  valueProposition:
                    "Delivers consistent, professional communication at scale",
                  children: [
                    {
                      id: "unit-b1-1-a-1",
                      name: "HTML Generator",
                      description:
                        "Converts templates and variables into email HTML",
                      useCases: ["Dynamic variables", "Brand styling"],
                      valueProposition:
                        "Ensures attractive and responsive email content",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
