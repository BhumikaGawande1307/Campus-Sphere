import { AISkillGapAnalysis, CareerActionItem, CareerActionPlan } from '../types';

export const aiService = {
  async getSkillGapAnalysis(targetRole: string = 'Full-Stack Developer'): Promise<AISkillGapAnalysis> {
    const actionPlan = await this.getActionPlan(targetRole);

    return {
      target_role: targetRole,
      match_percentage: 65,
      possessed_skills: ['React & TypeScript', 'PostgreSQL & Database Optimization'],
      missing_skills: ['Docker & Containerization', 'Kubernetes & Helm'],
      recommended_courses: ['Mastering Docker for Production Scale'],
      recommended_certifications: ['Certified Kubernetes Application Developer'],
      recommended_projects: ['Build an end-to-end Full-Stack project integrating Docker'],
      recommended_events: [],
      recommended_scholarships: [],
      action_plan: actionPlan.items,
    };
  },

  async askAssistant(question: string): Promise<{
    answer: string;
    structured_card?: {
      recommendation: string;
      why: string;
      action_label: string;
      action_link?: string;
    };
    profile_context?: any;
  }> {
    return {
      answer: `CampusSphere AI: Based on your query "${question}", I recommend completing at least 3 featured projects and acquiring 2 industry-recognized certificates.`,
      profile_context: {
        skills_count: 5,
        certificates_count: 2,
        campus_points: 540,
        scholarships_tracked: 1,
      },
    };
  },

  async getActionPlan(targetRole: string = 'Full-Stack Developer'): Promise<CareerActionPlan> {
    return {
      student_id: 1,
      target_role: targetRole,
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'act-1',
          text: 'Master Kubernetes Ingress controllers & Helm chart packaging for microservices',
          category: 'SKILL',
          is_completed: true,
          created_at: new Date().toISOString(),
        }
      ],
    };
  },

  async toggleActionItem(itemId: string): Promise<CareerActionPlan> {
    return this.getActionPlan();
  },

  async addActionItem(text: string, category: CareerActionItem['category'] = 'GENERAL'): Promise<CareerActionPlan> {
    return this.getActionPlan();
  },

  async deleteActionItem(itemId: string): Promise<CareerActionPlan> {
    return this.getActionPlan();
  },
};
