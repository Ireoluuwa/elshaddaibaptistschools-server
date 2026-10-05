import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {
  createApp,
  Fixtures,
  login,
  resetDatabase,
  resultBody,
  seed,
} from './helpers';

describe('School flows (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;
  let admin: string;
  let teacher: string;
  let bursar: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    await resetDatabase();
    app = await createApp();
    fx = await seed(app);
    [admin, teacher, bursar] = await Promise.all([
      login(app, 'admin'),
      login(app, 'teacher'),
      login(app, 'bursar'),
    ]);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('closed-term lock', () => {
    let resultId: string;

    beforeAll(async () => {
      const res = await api()
        .post('/api/results')
        .set('Authorization', teacher)
        .send(resultBody(fx.students.jss1a, fx.termId));
      expect(res.status).toBe(201);
      resultId = res.body.data.id;

      const close = await api()
        .post(`/api/academics/terms/${fx.termId}/close`)
        .set('Authorization', admin);
      expect(close.status).toBe(200);
    });

    it('stops teachers saving results', async () => {
      const res = await api()
        .post('/api/results')
        .set('Authorization', teacher)
        .send(resultBody(fx.students.jss1a, fx.termId));
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/closed/i);
    });

    it('stops bulk uploads', async () => {
      const res = await api()
        .post('/api/results/bulk')
        .set('Authorization', teacher)
        .send({ results: [resultBody(fx.students.jss1b, fx.termId)] });
      expect(res.status).toBe(403);
    });

    it('stops the admin adding a V.P remark', async () => {
      const res = await api()
        .patch(`/api/admin/results/${resultId}/vp-remark`)
        .set('Authorization', admin)
        .send({ vpRemark: 'Good work' });
      expect(res.status).toBe(403);
    });

    it('stops report sheet details changing', async () => {
      const res = await api()
        .patch(`/api/academics/terms/${fx.termId}/report-details`)
        .set('Authorization', admin)
        .send({ vacationDate: '2026-12-18' });
      expect(res.status).toBe(403);
    });

    it('stops the bursar changing the bill', async () => {
      const res = await api()
        .put(`/api/bursary/bills/${fx.classes.JSS1}?termId=${fx.termId}`)
        .set('Authorization', bursar)
        .send({ tuition: 100000, ict: 5000, otherCharges: [] });
      expect(res.status).toBe(403);
    });

    it('allows changes again once reopened', async () => {
      const reopen = await api()
        .post(`/api/academics/terms/${fx.termId}/activate`)
        .set('Authorization', admin);
      expect(reopen.status).toBe(200);

      const save = await api()
        .post('/api/results')
        .set('Authorization', teacher)
        .send(resultBody(fx.students.jss1a, fx.termId));
      expect(save.status).toBe(201);

      const remark = await api()
        .patch(`/api/admin/results/${resultId}/vp-remark`)
        .set('Authorization', admin)
        .send({ vpRemark: 'Good work' });
      expect(remark.status).toBe(200);
    });
  });

  describe('fee hold', () => {
    let student: string;

    beforeAll(async () => {
      student = await login(app, 'jss1a');
      const res = await api()
        .put(`/api/bursary/fees?termId=${fx.termId}`)
        .set('Authorization', bursar)
        .send({ fees: [{ studentId: fx.students.jss1a, outstanding: 45000 }] });
      expect(res.status).toBe(200);
    });

    it('withholds the result from a student who owes', async () => {
      const res = await api()
        .get(`/api/results/my-result?termId=${fx.termId}`)
        .set('Authorization', student);
      expect(res.status).toBe(200);
      expect(res.body.data.result).toBeNull();
      expect(res.body.data.feesHold).toEqual({ outstanding: 45000 });
      expect(JSON.stringify(res.body)).not.toContain('Mathematics');
    });

    it('shows the result once the fees are cleared', async () => {
      await api()
        .put(`/api/bursary/fees?termId=${fx.termId}`)
        .set('Authorization', bursar)
        .send({ fees: [{ studentId: fx.students.jss1a, outstanding: 0 }] })
        .expect(200);

      const res = await api()
        .get(`/api/results/my-result?termId=${fx.termId}`)
        .set('Authorization', student);
      expect(res.body.data.feesHold).toBeNull();
      expect(res.body.data.result.scores[0].subjectName).toBe('Mathematics');
      expect(res.body.data.result.vpRemark).toBe('Good work');
    });

    it('does not let students set their own fees', async () => {
      const res = await api()
        .put(`/api/bursary/fees?termId=${fx.termId}`)
        .set('Authorization', student)
        .send({ fees: [{ studentId: fx.students.jss1a, outstanding: 0 }] });
      expect(res.status).toBe(403);
    });
  });

  describe('promotion rollover', () => {
    const placement = async () => {
      const rows: {
        id: string;
        schoolClassId: string | null;
        departmentId: string | null;
      }[] = await app
        .get(DataSource)
        .query(
          `SELECT id, "schoolClassId", "departmentId" FROM student_profiles`,
        );
      return Object.fromEntries(rows.map((r) => [r.id, r]));
    };
    const enrollmentCount = async () =>
      Number(
        (await app.get(DataSource).query(`SELECT count(*) FROM enrollments`))[0]
          .count,
      );

    beforeAll(async () => {
      const decide = (classId: string, decisions: object[]) =>
        api()
          .put(`/api/admin/promotions/${classId}`)
          .set('Authorization', admin)
          .send({ decisions });

      await decide(fx.classes.JSS1, [
        { studentId: fx.students.jss1a, outcome: 'promoted' },
        { studentId: fx.students.jss1b, outcome: 'repeated' },
      ]).expect(200);
      await decide(fx.classes.JSS3, [
        {
          studentId: fx.students.jss3a,
          outcome: 'promoted',
          departmentId: fx.departments.Art,
        },
      ]).expect(200);
      await decide(fx.classes.SS3, [
        { studentId: fx.students.ss3a, outcome: 'graduated' },
      ]).expect(200);
    });

    it('refuses a junior→senior promotion without a department', async () => {
      const res = await api()
        .put(`/api/admin/promotions/${fx.classes.JSS3}`)
        .set('Authorization', admin)
        .send({
          decisions: [{ studentId: fx.students.jss3a, outcome: 'promoted' }],
        });
      expect(res.status).toBe(400);
    });

    it('moves everyone when the new session starts', async () => {
      const res = await api()
        .post('/api/academics/sessions')
        .set('Authorization', admin)
        .send({
          name: '2027/2028',
          firstTerm: {
            name: '1st Term',
            startDate: '2027-09-13',
            endDate: '2027-12-17',
            makeActive: true,
          },
        });
      expect(res.status).toBe(201);

      const p = await placement();
      expect(p[fx.students.jss1a].schoolClassId).toBe(fx.classes.JSS2);
      expect(p[fx.students.jss1b].schoolClassId).toBe(fx.classes.JSS1);
      expect(p[fx.students.jss3a]).toMatchObject({
        schoolClassId: fx.classes.SS1,
        departmentId: fx.departments.Art,
      });
      expect(p[fx.students.ss3a]).toMatchObject({
        schoolClassId: null,
        departmentId: null,
      });

      // Three continuing students get a new enrollment; the graduate doesn't.
      expect(await enrollmentCount()).toBe(4 + 3);
    });

    it('keeps last session’s placement on old results', async () => {
      const student = await login(app, 'jss1a');
      const res = await api()
        .get(`/api/results/my-result?termId=${fx.termId}`)
        .set('Authorization', student);
      expect(res.body.data.student.class).toMatch(/JSS ?1/);
    });

    it('does not roll over twice', async () => {
      const sessions = await api()
        .get('/api/academics/sessions')
        .set('Authorization', admin);
      const oldTerm = fx.termId;
      const newTermId = sessions.body.data.find(
        (s: { name: string }) => s.name === '2027/2028',
      ).terms[0].id;

      await api()
        .post(`/api/academics/terms/${oldTerm}/activate`)
        .set('Authorization', admin)
        .expect(200);
      await api()
        .post(`/api/academics/terms/${newTermId}/activate`)
        .set('Authorization', admin)
        .expect(200);

      const p = await placement();
      expect(p[fx.students.jss1a].schoolClassId).toBe(fx.classes.JSS2);
      expect(await enrollmentCount()).toBe(7);
    });
  });
});
