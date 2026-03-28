import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/services/:id/eligibility-rules  — get rules for a service
export const getEligibilityRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const rules = await prisma.eligibilityRule.findMany({
      where: { service_id: parseInt(id) },
      orderBy: { id: 'asc' },
    });

    successResponse(res, 200, 'Eligibility rules fetched.', {
      service_id: parseInt(id),
      service_title: service.title,
      rules,
    });
  } catch (error) {
    console.error('GetEligibilityRules error:', error);
    errorResponse(res, 500, 'Could not fetch eligibility rules.');
  }
};

// POST /api/v1/services/:id/check-eligibility  — user submits answers
export const checkEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // answers: [{ rule_id: 1, answer: "yes" }, ...]
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      errorResponse(res, 400, 'answers array is required.'); return;
    }

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const rules = await prisma.eligibilityRule.findMany({
      where: { service_id: parseInt(id) },
    });

    if (rules.length === 0) {
      successResponse(res, 200, 'No eligibility rules defined. You may be eligible.', {
        eligible: true,
        message: 'This service has no eligibility restrictions.',
        results: [],
      });
      return;
    }

    const results: { rule_id: number; question: string; passed: boolean; reason: string }[] = [];
    let allPassed = true;

    for (const rule of rules) {
      const userAnswer = answers.find((a: { rule_id: number; answer: string }) => a.rule_id === rule.id);
      const answer = userAnswer?.answer?.toString().trim().toLowerCase() ?? '';
      let passed = false;
      let reason = '';

      if (rule.answer_type === 'yes_no') {
        passed = answer === rule.expected.toLowerCase();
        reason = passed
          ? `Correct: "${answer}" matches required "${rule.expected}"`
          : `Required "${rule.expected}", you answered "${answer}"`;
      } else if (rule.answer_type === 'age') {
        const age = parseInt(answer);
        const match = rule.expected.match(/^(>=|<=|>|<|=)(\d+)$/);
        if (!isNaN(age) && match) {
          const [, op, val] = match;
          const threshold = parseInt(val);
          if (op === '>=') passed = age >= threshold;
          else if (op === '<=') passed = age <= threshold;
          else if (op === '>') passed = age > threshold;
          else if (op === '<') passed = age < threshold;
          else if (op === '=') passed = age === threshold;
          reason = passed
            ? `Age ${age} satisfies condition ${rule.expected}`
            : `Age ${age} does not satisfy condition ${rule.expected}`;
        } else {
          reason = 'Invalid age input.';
        }
      } else if (rule.answer_type === 'text') {
        passed = answer === rule.expected.toLowerCase();
        reason = passed
          ? `Answer matches requirement`
          : `Required "${rule.expected}", you answered "${answer}"`;
      }

      if (!passed) allPassed = false;
      results.push({ rule_id: rule.id, question: rule.question, passed, reason });
    }

    successResponse(res, 200, allPassed ? 'You are eligible for this service!' : 'You may not be eligible for this service.', {
      eligible: allPassed,
      service_id: parseInt(id),
      service_title: service.title,
      results,
    });
  } catch (error) {
    console.error('CheckEligibility error:', error);
    errorResponse(res, 500, 'Could not check eligibility.');
  }
};

// POST /api/v1/admin/services/:id/eligibility-rules  (Admin)
export const createEligibilityRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { question, answer_type, expected, description } = req.body;

    if (!question || !answer_type || !expected) {
      errorResponse(res, 400, 'question, answer_type and expected are required.'); return;
    }

    const validTypes = ['yes_no', 'age', 'text'];
    if (!validTypes.includes(answer_type)) {
      errorResponse(res, 400, `answer_type must be one of: ${validTypes.join(', ')}`); return;
    }

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const rule = await prisma.eligibilityRule.create({
      data: {
        service_id: parseInt(id),
        question: question.trim(),
        answer_type,
        expected: expected.trim(),
        description: description || null,
      },
    });

    successResponse(res, 201, 'Eligibility rule created.', rule);
  } catch (error) {
    console.error('CreateEligibilityRule error:', error);
    errorResponse(res, 500, 'Could not create eligibility rule.');
  }
};

// PUT /api/v1/admin/eligibility-rules/:id  (Admin)
export const updateEligibilityRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { question, answer_type, expected, description } = req.body;

    const exists = await prisma.eligibilityRule.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Eligibility rule not found.'); return; }

    const updateData: Record<string, string | null> = {};
    if (question) updateData.question = question.trim();
    if (answer_type) updateData.answer_type = answer_type;
    if (expected) updateData.expected = expected.trim();
    if (description !== undefined) updateData.description = description;

    const rule = await prisma.eligibilityRule.update({ where: { id: parseInt(id) }, data: updateData });
    successResponse(res, 200, 'Eligibility rule updated.', rule);
  } catch (error) {
    console.error('UpdateEligibilityRule error:', error);
    errorResponse(res, 500, 'Could not update eligibility rule.');
  }
};

// DELETE /api/v1/admin/eligibility-rules/:id  (Admin)
export const deleteEligibilityRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exists = await prisma.eligibilityRule.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Eligibility rule not found.'); return; }

    await prisma.eligibilityRule.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Eligibility rule deleted.');
  } catch (error) {
    console.error('DeleteEligibilityRule error:', error);
    errorResponse(res, 500, 'Could not delete eligibility rule.');
  }
};
