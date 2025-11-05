/**
 * Converts resume JSON from the builder into a clean, flat text string 
 * for the Gemini AI to analyze.
 */
export function convertJsonToText(data: any): string {
  let text = "";

  // Helper to safely add a section
  const addSection = (title: string, content: string | string[]) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return;
    }
    text += `\n--- ${title.toUpperCase()} ---\n`;
    if (Array.isArray(content)) {
      text += content.join(', ') + '\n';
    } else {
      text += `${content}\n`;
    }
  };

  // Build the text string
  if (data.name) text += `${data.name}\n`;
  if (data.email) text += `${data.email}\n`;
  if (data.phone) text += `${data.phone}\n`;

  addSection("Summary", data.summary);

  if (data.workExperience?.length) {
    text += "\n--- WORK EXPERIENCE ---\n";
    data.workExperience.forEach((job: any) => {
      text += `\n${job.title} at ${job.company}\n`;
      if (job.description) text += `${job.description}\n`;
    });
  }

  // Use the new, correct 'education' array
  if (data.education?.length) {
    text += "\n--- EDUCATION ---\n";
    data.education.forEach((edu: any) => {
      text += `\n${edu.degree} in ${edu.fieldOfStudy || ''} from ${edu.institution}\n`;
    });
  }
  
  addSection("Skills", data.skills);

  return text.trim();
}