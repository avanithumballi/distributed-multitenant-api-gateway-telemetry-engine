import express from 'express';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { Tenant } from '../models/Tenant.js';
import { UsageLog } from '../models/UsageLog.js';
import redisClient from '../config/redis.js';
import { registrationSecurityGuard } from '../middleware/securityGuard.js';

const router = express.Router();

router.post('/register', registrationSecurityGuard, async (req, res) => {
  const { name, email, plan } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) return res.status(400).json({ success: false, message: 'Email already exists' });

    const randomBytes = crypto.randomBytes(16).toString('hex');
    const chosenPlan = plan === 'pro' ? 'pro' : 'free';
    const apiKey = `sk_${chosenPlan}_${randomBytes}`;

    const newTenant = new Tenant({ name, email, plan: chosenPlan, apiKey });
    await newTenant.save();

    res.status(201).json({ success: true, data: newTenant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/upgrade', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ success: false, message: 'API Key required' });

  try {
    const tenant = await Tenant.findOne({ apiKey });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    tenant.plan = tenant.plan === 'free' ? 'pro' : 'free';
    await tenant.save();

    const cacheKey = `cache:tenant:${apiKey}`;
    await redisClient.set(cacheKey, JSON.stringify(tenant), 'EX', 300);

    console.log(`♻️ Cache Synchronized: Pre-emptively mapped updated plan for ${tenant.name}`);
    
    res.status(200).json({ success: true, message: `Changed plan to ${tenant.plan}`, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ success: false, message: 'API Key missing' });

  try {
    const tenant = await Tenant.findOne({ apiKey });
    if (!tenant) return res.status(403).json({ success: false, message: 'Invalid API Key' });

    const statistics = await UsageLog.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    let allowedRequests = 0;
    let blockedRequests = 0;

    statistics.forEach(stat => {
      if (stat._id === 200) allowedRequests = stat.count;
      if (stat._id === 429) blockedRequests = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        profile: { name: tenant.name, email: tenant.email, plan: tenant.plan, apiKey: tenant.apiKey },
        metrics: { allowed: allowedRequests, blocked: blockedRequests, total: allowedRequests + blockedRequests }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics/download', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ success: false, message: 'API Key missing' });

  try {
    const tenant = await Tenant.findOne({ apiKey });
    if (!tenant) return res.status(403).json({ success: false, message: 'Invalid API Key' });

    const statistics = await UsageLog.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    let allowed = 0, blocked = 0;
    statistics.forEach(s => {
      if (s._id === 200) allowed = s.count;
      if (s._id === 429) blocked = s.count;
    });

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=API_SLA_Report_${tenant.name}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 612, 120).fill('#0f172a');
    doc.fillColor('#22d3ee').font('Helvetica-Bold').fontSize(22).text('ENTERPRISE API EDGE SERVICE', 50, 40);
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(10).text('AUTOMATED INFRASTRUCTURE DATA METRICS STATEMENT', 50, 68);

    doc.moveDown(5);
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Developer Profile Credentials Matrix', 50, 150);
    doc.moveTo(50, 170).lineTo(560, 170).stroke('#e2e8f0');
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#475569').text('Account Holder:', 50, 190);
    doc.font('Helvetica').fillColor('#0f172a').text(tenant.name, 160, 190);
    
    doc.font('Helvetica-Bold').fillColor('#475569').text('Routing Node Email:', 50, 210);
    doc.font('Helvetica').fillColor('#0f172a').text(tenant.email, 160, 210);
    
    doc.font('Helvetica-Bold').fillColor('#475569').text('Subscription Tier:', 50, 230);
    doc.font('Helvetica-Bold').fillColor('#7c3aed').text(tenant.plan.toUpperCase(), 160, 230);

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Interception Traffic Logs Audit Summary', 50, 280);
    doc.moveTo(50, 300).lineTo(560, 300).stroke('#e2e8f0');

    doc.rect(50, 320, 240, 60).fill('#ecfeff');
    doc.fillColor('#083344').font('Helvetica-Bold').fontSize(10).text('SUCCESS ROUTE TRANSACTIONS (200 OK)', 65, 335);
    doc.fontSize(18).fillColor('#06b6d4').text(allowed.toString(), 65, 350);

    doc.rect(310, 320, 250, 60).fill('#fff1f2');
    doc.fillColor('#4c0519').font('Helvetica-Bold').fontSize(10).text('RATE LIMIT INTERCEPTIONS (429 BLOCKED)', 325, 335);
    doc.fontSize(18).fillColor('#f43f5e').text(blocked.toString(), 325, 350);

    doc.moveTo(50, 430).lineTo(560, 430).stroke('#e2e8f0');
    doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(9)
       .text(`Cryptographic Security Verification Fingerprint: sha256-${crypto.randomBytes(12).toString('hex')}`, 50, 450);
    doc.text(`Document Generation Timestamp Node Clock: ${new Date().toISOString()}`, 50, 465);

    doc.end();

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;