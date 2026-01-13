/**
 * Comprehensive API Test Script
 * Tests all CRUD operations for all entities
 *
 * Usage: node test-api.js <API_KEY>
 */

const BASE_URL = 'http://localhost:3000/api/v1';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

async function apiRequest(endpoint, method = 'GET', body = null, apiKey) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

class TestRunner {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
    };
    this.createdIds = {
      projects: [],
      users: [],
      issues: [],
      wiki: [],
    };
  }

  async test(name, fn) {
    try {
      logInfo(`Running: ${name}`);
      await fn();
      logSuccess(`PASSED: ${name}`);
      this.results.passed++;
    } catch (error) {
      logError(`FAILED: ${name}`);
      logError(`  Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
    }
  }

  // ==================== PROJECT TESTS ====================
  async testProjects() {
    logSection('Testing Projects API');

    await this.test('Create Project 1', async () => {
      const response = await apiRequest('/projects', 'POST', {
        name: 'Test Project Alpha',
        key: 'TPA',
        description: 'First test project',
      }, this.apiKey);

      const project = response.data || response;
      if (!project._id) throw new Error('No _id returned');
      this.createdIds.projects.push(project._id);
      logInfo(`  Created project: ${project.name} (${project._id})`);
    });

    await this.test('Create Project 2', async () => {
      const response = await apiRequest('/projects', 'POST', {
        name: 'Test Project Beta',
        key: 'TPB',
        description: 'Second test project',
      }, this.apiKey);

      const project = response.data || response;
      if (!project._id) throw new Error('No _id returned');
      this.createdIds.projects.push(project._id);
      logInfo(`  Created project: ${project.name} (${project._id})`);
    });

    await this.test('Get All Projects', async () => {
      const response = await apiRequest('/projects', 'GET', null, this.apiKey);
      const projects = response.data || response;
      if (!Array.isArray(projects)) throw new Error('Expected array');
      if (projects.length < 2) throw new Error('Expected at least 2 projects');
      logInfo(`  Found ${projects.length} projects`);
    });

    await this.test('Get Project by ID', async () => {
      const projectId = this.createdIds.projects[0];
      const response = await apiRequest(`/projects/${projectId}`, 'GET', null, this.apiKey);
      const project = response.data || response;
      logInfo(`  Retrieved: ${project.name}`);
    });

    await this.test('Update Project', async () => {
      const projectId = this.createdIds.projects[0];
      const response = await apiRequest(`/projects/${projectId}`, 'PUT', {
        name: 'Test Project Alpha Updated',
        description: 'Updated description',
      }, this.apiKey);

      const updated = response.data || response;
      if (updated.name !== 'Test Project Alpha Updated') {
        throw new Error('Project not updated');
      }
      logInfo(`  Updated project name`);
    });
  }

  // ==================== ISSUE TESTS ====================
  async testIssues() {
    logSection('Testing Issues API');

    if (this.createdIds.projects.length === 0) {
      logError('No projects available for issue tests');
      return;
    }

    const projectId = this.createdIds.projects[0];

    await this.test('Create Issue 1', async () => {
      const response = await apiRequest('/issues', 'POST', {
        projectId,
        title: 'Test Issue Alpha',
        description: 'First test issue description',
        priority: 'high',
      }, this.apiKey);

      const issue = response.data || response;
      if (!issue._id) throw new Error('No _id returned');
      this.createdIds.issues.push(issue._id);
      logInfo(`  Created issue: ${issue.issueNumber} - ${issue.title}`);
    });

    await this.test('Create Issue 2', async () => {
      const response = await apiRequest('/issues', 'POST', {
        projectId,
        title: 'Test Issue Beta',
        description: 'Second test issue description',
        priority: 'medium',
        tags: ['test', 'api'],
      }, this.apiKey);

      const issue = response.data || response;
      if (!issue._id) throw new Error('No _id returned');
      this.createdIds.issues.push(issue._id);
      logInfo(`  Created issue: ${issue.issueNumber} - ${issue.title}`);
    });

    await this.test('Get All Issues', async () => {
      const response = await apiRequest('/issues', 'GET', null, this.apiKey);
      const issues = response.data || response;
      if (!Array.isArray(issues)) throw new Error('Expected array');
      if (issues.length < 2) throw new Error('Expected at least 2 issues');
      logInfo(`  Found ${issues.length} issues`);
    });

    await this.test('Get Issue by ID', async () => {
      const issueId = this.createdIds.issues[0];
      const response = await apiRequest(`/issues/${issueId}`, 'GET', null, this.apiKey);
      const issue = response.data || response;
      logInfo(`  Retrieved: ${issue.issueNumber}`);
    });

    await this.test('Update Issue', async () => {
      const issueId = this.createdIds.issues[0];
      const response = await apiRequest(`/issues/${issueId}`, 'PUT', {
        title: 'Test Issue Alpha Updated',
        status: 'in_progress',
        priority: 'critical',
      }, this.apiKey);

      const updated = response.data || response;
      if (updated.status !== 'in_progress') {
        throw new Error('Issue not updated');
      }
      logInfo(`  Updated issue status to in_progress`);
    });
  }

  // ==================== WIKI TESTS ====================
  async testWiki() {
    logSection('Testing Wiki API');

    await this.test('Create Wiki Page 1', async () => {
      const response = await apiRequest('/wiki', 'POST', {
        title: 'Test Wiki Alpha',
        slug: 'test-wiki-alpha-' + Date.now(),
        content: '# Test Wiki Alpha\n\nThis is test content.',
        tags: ['test', 'documentation'],
      }, this.apiKey);

      const page = response.data || response;
      if (!page._id) throw new Error('No _id returned');
      this.createdIds.wiki.push({ id: page._id, slug: page.slug });
      logInfo(`  Created wiki: ${page.title} (${page.slug})`);
    });

    await this.test('Create Wiki Page 2', async () => {
      const response = await apiRequest('/wiki', 'POST', {
        title: 'Test Wiki Beta',
        slug: 'test-wiki-beta-' + Date.now(),
        content: '# Test Wiki Beta\n\nThis is more test content.',
        tags: ['test'],
      }, this.apiKey);

      const page = response.data || response;
      if (!page._id) throw new Error('No _id returned');
      this.createdIds.wiki.push({ id: page._id, slug: page.slug });
      logInfo(`  Created wiki: ${page.title} (${page.slug})`);
    });

    await this.test('Get All Wiki Pages', async () => {
      const response = await apiRequest('/wiki', 'GET', null, this.apiKey);
      const pages = response.data || response;
      if (!Array.isArray(pages)) throw new Error('Expected array');
      if (pages.length < 2) throw new Error('Expected at least 2 wiki pages');
      logInfo(`  Found ${pages.length} wiki pages`);
    });

    await this.test('Get Wiki by Slug', async () => {
      const slug = this.createdIds.wiki[0].slug;
      const response = await apiRequest(`/wiki/${slug}`, 'GET', null, this.apiKey);
      const page = response.data || response;
      if (page.slug !== slug) throw new Error('Wrong page returned');
      logInfo(`  Retrieved: ${page.title}`);
    });

    await this.test('Update Wiki Page', async () => {
      const slug = this.createdIds.wiki[0].slug;
      const response = await apiRequest(`/wiki/${slug}`, 'PUT', {
        title: 'Test Wiki Alpha Updated',
        content: '# Updated Content\n\nThis content has been updated.',
      }, this.apiKey);

      const updated = response.data || response;
      if (updated.title !== 'Test Wiki Alpha Updated') {
        throw new Error('Wiki page not updated');
      }
      // Update the slug since it changed with the title
      this.createdIds.wiki[0].slug = updated.slug;
      logInfo(`  Updated wiki page title (new slug: ${updated.slug})`);
    });
  }

  // ==================== CLEANUP ====================
  async cleanup() {
    logSection('Cleaning Up Test Data (Deleting 1 of each type)');

    // Delete ONE issue (the first one) - leave the second one
    if (this.createdIds.issues.length > 0) {
      const issueId = this.createdIds.issues[0];
      await this.test(`Delete Issue ${issueId}`, async () => {
        await apiRequest(`/issues/${issueId}`, 'DELETE', null, this.apiKey);
        logInfo(`  Deleted issue: ${issueId}`);
      });
      logInfo(`  Kept issue: ${this.createdIds.issues[1]} (not deleted)`);
    }

    // Delete ONE wiki page (the first one) - leave the second one
    if (this.createdIds.wiki.length > 0) {
      const wiki = this.createdIds.wiki[0];
      await this.test(`Delete Wiki ${wiki.slug}`, async () => {
        await apiRequest(`/wiki/${wiki.slug}`, 'DELETE', null, this.apiKey);
        logInfo(`  Deleted wiki: ${wiki.slug}`);
      });
      if (this.createdIds.wiki.length > 1) {
        logInfo(`  Kept wiki: ${this.createdIds.wiki[1].slug} (not deleted)`);
      }
    }

    // Delete ONE project (the second one) - leave the first one because it has an issue attached
    if (this.createdIds.projects.length > 1) {
      const projectId = this.createdIds.projects[1];
      await this.test(`Delete Project ${projectId}`, async () => {
        await apiRequest(`/projects/${projectId}`, 'DELETE', null, this.apiKey);
        logInfo(`  Deleted project: ${projectId}`);
      });
      logInfo(`  Kept project: ${this.createdIds.projects[0]} (has remaining issue)`);
    }
  }

  // ==================== RUN ALL TESTS ====================
  async runAll() {
    log('\n🚀 Starting API Test Suite\n', 'bright');

    const startTime = Date.now();

    await this.testProjects();
    await this.testIssues();
    await this.testWiki();
    await this.cleanup();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    logSection('Test Summary');
    log(`Total Tests: ${this.results.passed + this.results.failed}`, 'bright');
    logSuccess(`Passed: ${this.results.passed}`);

    if (this.results.failed > 0) {
      logError(`Failed: ${this.results.failed}`);
      console.log('\nFailed Tests:');
      this.results.errors.forEach((err, i) => {
        logError(`  ${i + 1}. ${err.test}`);
        logError(`     ${err.error}`);
      });
    } else {
      log('\n🎉 All tests passed!', 'green');
    }

    log(`\nDuration: ${duration}s`, 'cyan');

    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// ==================== MAIN ====================
async function main() {
  const apiKey = process.argv[2];

  if (!apiKey) {
    logError('Usage: node test-api.js <API_KEY>');
    logInfo('\nYou need to provide an API key with the following permissions:');
    logInfo('  - projects:read, projects:write');
    logInfo('  - issues:read, issues:write');
    logInfo('  - wiki:read, wiki:write');
    logInfo('\nCreate an API key at: http://localhost:3000/api-keys');
    process.exit(1);
  }

  const runner = new TestRunner(apiKey);
  await runner.runAll();
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
