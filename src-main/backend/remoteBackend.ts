import type {
  BackendContract,
  Credentials,
  AuthResult,
  User,
  NewProjectParams,
  Project,
  RecentProject,
  CasePlanModelSummary,
  CasePlanModel,
  ValidationResult,
  PublishParams,
  PublishResult,
  DomainContextSummary,
  DomainContext,
  TestScenarioParams,
  TestRunId,
  TestEvent,
  TestScenario,
} from './contract'

export class RemoteBackend implements BackendContract {
  async authenticate(_credentials?: Credentials): Promise<AuthResult> {
    throw new Error('not yet implemented')
  }

  async getCurrentUser(): Promise<User | null> {
    throw new Error('not yet implemented')
  }

  async newProject(_params: NewProjectParams): Promise<Project> {
    throw new Error('not yet implemented')
  }

  async openProject(_path: string): Promise<Project> {
    throw new Error('not yet implemented')
  }

  async saveProject(_project: Project): Promise<void> {
    throw new Error('not yet implemented')
  }

  async saveProjectAs(_project: Project, _newPath: string): Promise<Project> {
    throw new Error('not yet implemented')
  }

  async getRecentProjects(): Promise<RecentProject[]> {
    throw new Error('not yet implemented')
  }

  async removeRecentProject(_path: string): Promise<void> {
    throw new Error('not yet implemented')
  }

  async listCasePlanModels(_projectId: string): Promise<CasePlanModelSummary[]> {
    throw new Error('not yet implemented')
  }

  async getCasePlanModel(_projectId: string, _id: string): Promise<CasePlanModel> {
    throw new Error('not yet implemented')
  }

  async saveCasePlanModel(_projectId: string, _cpm: CasePlanModel): Promise<void> {
    throw new Error('not yet implemented')
  }

  async deleteCasePlanModel(_projectId: string, _id: string): Promise<void> {
    throw new Error('not yet implemented')
  }

  async validateCasePlanModel(_cpm: CasePlanModel): Promise<ValidationResult> {
    throw new Error('not yet implemented')
  }

  async publishCasePlanModel(_params: PublishParams): Promise<PublishResult> {
    throw new Error('not yet implemented')
  }

  async listDomainContextLibrary(): Promise<DomainContextSummary[]> {
    throw new Error('not yet implemented')
  }

  async getDomainContext(_id: string, _version?: string): Promise<DomainContext> {
    throw new Error('not yet implemented')
  }

  async createDomainContext(_dc: DomainContext): Promise<void> {
    throw new Error('not yet implemented')
  }

  async forkDomainContext(_sourceId: string, _sourceVersion: string): Promise<DomainContext> {
    throw new Error('not yet implemented')
  }

  async saveDomainContext(_dc: DomainContext): Promise<void> {
    throw new Error('not yet implemented')
  }

  async publishDomainContext(_dc: DomainContext): Promise<void> {
    throw new Error('not yet implemented')
  }

  async installDomainContextPackage(_packageId: string, _version?: string): Promise<void> {
    throw new Error('not yet implemented')
  }

  async runTestScenario(_params: TestScenarioParams): Promise<TestRunId> {
    throw new Error('not yet implemented')
  }

  async *getTestRunEvents(_runId: TestRunId): AsyncIterable<TestEvent> {
    throw new Error('not yet implemented')
  }

  async cancelTestRun(_runId: TestRunId): Promise<void> {
    throw new Error('not yet implemented')
  }

  async listTestScenarios(_projectId: string): Promise<TestScenario[]> {
    throw new Error('not yet implemented')
  }

  async saveTestScenario(_projectId: string, _ts: TestScenario): Promise<void> {
    throw new Error('not yet implemented')
  }

  async deleteTestScenario(_projectId: string, _id: string): Promise<void> {
    throw new Error('not yet implemented')
  }
}
