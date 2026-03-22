import { IconExternal, IconFolderAdd, IconHumanSignal, IconUserAdd, IconFolderOpen, IconGrid } from "@humansignal/icons";
import { Button, SimpleCard, Spinner, Tooltip, Typography } from "@humansignal/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUpdatePageTitle } from "@humansignal/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { HeidiTips } from "../../components/HeidiTips/HeidiTips";
import { useAPI } from "../../providers/ApiProvider";
import { CreateProject } from "../CreateProject/CreateProject";
import { InviteLink } from "../Organization/PeoplePage/InviteLink";
import type { Page } from "../types/Page";
import { FF_WORKSPACES, isFF } from "../../utils/feature-flags";
import {
  creationDialogOpen,
  invitationOpen,
  locationKeyAtom,
  PROJECTS_TO_SHOW,
  projectsDataAtom,
  sortedProjectsAtom,
  visitedIdsAtom,
} from "./atoms";

const resources = [
  {
    title: "Documentation",
    url: "https://labelstud.io/guide/",
  },
  {
    title: "API Documentation",
    url: "https://api.labelstud.io/api-reference/introduction/getting-started",
  },
  {
    title: "Release Notes",
    url: "https://labelstud.io/learn/categories/release-notes/",
  },
  {
    title: "LabelStud.io Blog",
    url: "https://labelstud.io/blog/",
  },
  {
    title: "Slack Community",
    url: "https://slack.labelstud.io",
  },
];

const actions = [
  {
    title: "Create Project",
    icon: IconFolderAdd,
    type: "createProject",
  },
  {
    title: "Invite Members",
    icon: IconUserAdd,
    type: "inviteMembers",
  },
] as const;

type Action = (typeof actions)[number]["type"];

export const HomePage: Page = () => {
  const api = useAPI();
  const location = useLocation();
  const [modalIsOpen, setModalIsOpen] = useAtom(creationDialogOpen);
  const [invitationIsOpen, setInvitationIsOpen] = useAtom(invitationOpen);
  const setLocationKey = useSetAtom(locationKeyAtom);
  const setProjectsData = useSetAtom(projectsDataAtom);
  const sortedProjects = useAtomValue(sortedProjectsAtom);
  const visitedIds = useAtomValue(visitedIdsAtom);

  useUpdatePageTitle("Home");

  // Fetch workspaces (only when FF is active)
  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces"],
    async queryFn() {
      return api.callApi<{ results: APIWorkspace[] } | APIWorkspace[]>("workspaces");
    },
    enabled: isFF(FF_WORKSPACES),
  });

  // Fetch regular projects
  const { data, isFetching, isSuccess, isError } = useQuery({
    queryKey: ["projects", { page_size: PROJECTS_TO_SHOW }],
    async queryFn() {
      return api.callApi<{ results: APIProject[]; count: number }>("projects", {
        params: { page_size: PROJECTS_TO_SHOW },
      });
    },
  });

  // Fetch visited projects specifically by their IDs
  const { data: visitedProjectsData } = useQuery({
    queryKey: ["visited-projects", { ids: visitedIds }],
    async queryFn() {
      if (visitedIds.length === 0) return { results: [], count: 0 };

      return api.callApi<{ results: APIProject[]; count: number }>("projects", {
        params: {
          ids: visitedIds.join(","),
          page_size: visitedIds.length,
        },
      });
    },
    enabled: visitedIds.length > 0,
  });

  // Update location key atom when navigating to/returning to this page
  // This triggers visitedIdsAtom to re-read from localStorage
  // We use a timestamp to ensure the atom always updates, forcing a re-read
  useEffect(() => {
    setLocationKey(Date.now().toString());
  }, [location.pathname, setLocationKey]);

  // Merge visited and regular projects, removing duplicates
  useEffect(() => {
    const visitedProjects = visitedProjectsData?.results ?? [];
    const regularProjects = data?.results ?? [];

    // Merge and deduplicate
    const allProjects = [...visitedProjects, ...regularProjects];
    const uniqueProjects = Array.from(new Map(allProjects.map((p) => [p.id, p])).values());

    if (uniqueProjects.length > 0) {
      setProjectsData(uniqueProjects);
    }
  }, [data?.results, visitedProjectsData?.results, setProjectsData]);

  const workspaces: APIWorkspace[] = useMemo(() => {
    if (!workspacesData) return [];
    return Array.isArray(workspacesData) ? workspacesData : (workspacesData.results ?? []);
  }, [workspacesData]);

  // Group recent projects by their workspace (only workspaces that appear in recent projects)
  const recentWorkspaceGroups = useMemo(() => {
    if (!isFF(FF_WORKSPACES) || workspaces.length === 0 || sortedProjects.length === 0) return [];

    const wsMap = new Map(workspaces.map((ws) => [ws.id, ws]));
    const groups = new Map<number, { workspace: APIWorkspace; projects: APIProject[] }>();

    for (const project of sortedProjects) {
      if (project.workspace == null) continue;
      const ws = wsMap.get(project.workspace);
      if (!ws) continue;
      if (!groups.has(ws.id)) groups.set(ws.id, { workspace: ws, projects: [] });
      groups.get(ws.id)!.projects.push(project);
    }

    return Array.from(groups.values());
  }, [workspaces, sortedProjects]);

  const handleActions = (action: Action) => {
    return () => {
      switch (action) {
        case "createProject":
          setModalIsOpen(true);
          break;
        case "inviteMembers":
          setInvitationIsOpen(true);
          break;
      }
    };
  };

  return (
    <main className="p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_450px] gap-6">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Typography variant="headline" size="small">
              Welcome 👋
            </Typography>
            <Typography size="small" className="text-neutral-content-subtler">
              Let's get you started.
            </Typography>
          </div>
          <div className="flex justify-start gap-4">
            {actions.map((action) => {
              return (
                <Button
                  key={action.title}
                  look="outlined"
                  align="center"
                  className="flex-grow-0 text-16/24 gap-2 text-primary-content text-left min-w-[250px] [&_svg]:w-6 [&_svg]:h-6 pl-2"
                  onClick={handleActions(action.type)}
                  leading={<action.icon />}
                >
                  {action.title}
                </Button>
              );
            })}
          </div>

          {isFF(FF_WORKSPACES) && recentWorkspaceGroups.length > 0 && (
            <SimpleCard
              title={
                <>
                  Recent Workspaces{" "}
                  <a href="/workspaces" className="text-lg font-normal hover:underline">
                    View All
                  </a>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                {recentWorkspaceGroups.map(({ workspace, projects }) => (
                  <WorkspaceRecentGroup key={workspace.id} workspace={workspace} projects={projects} />
                ))}
              </div>
            </SimpleCard>
          )}

          <SimpleCard
            title={
              data && data?.count > 0 ? (
                <>
                  Recent Projects{" "}
                  <a href="/projects" className="text-lg font-normal hover:underline">
                    View All
                  </a>
                </>
              ) : null
            }
          >
            {isFetching ? (
              <div className="h-64 flex justify-center items-center">
                <Spinner />
              </div>
            ) : isError ? (
              <div className="h-64 flex justify-center items-center">can't load projects</div>
            ) : isSuccess && data && sortedProjects.length === 0 ? (
              <div className="flex flex-col justify-center items-center border border-primary-border-subtle bg-primary-emphasis-subtle rounded-lg h-64">
                <div
                  className={
                    "rounded-full w-12 h-12 flex justify-center items-center bg-accent-grape-subtle text-primary-icon"
                  }
                >
                  <IconFolderOpen />
                </div>
                <Typography variant="headline" size="small">
                  Create your first project
                </Typography>
                <Typography size="small" className="text-neutral-content-subtler">
                  Import your data and set up the labeling interface to start annotating
                </Typography>
                <Button className="mt-4" onClick={() => setModalIsOpen(true)} aria-label="Create new project">
                  Create Project
                </Button>
              </div>
            ) : isSuccess && data && sortedProjects.length > 0 ? (
              <div className="flex flex-col gap-1">
                {sortedProjects.map((project) => {
                  return <ProjectSimpleCard key={project.id} project={project} />;
                })}
              </div>
            ) : null}
          </SimpleCard>
        </section>
        <section className="flex flex-col gap-6">
          <HeidiTips collection="projectSettings" />
          <SimpleCard title="Resources" description="Learn, explore and get help" data-testid="resources-card">
            <ul>
              {resources.map((link) => {
                return (
                  <li key={link.title}>
                    <a
                      href={link.url}
                      className="py-2 px-1 flex justify-between items-center text-neutral-content"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.title}
                      <IconExternal className="text-primary-icon" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </SimpleCard>
          <div className="flex gap-2 items-center">
            <IconHumanSignal />
            <span className="text-neutral-content-subtle">Label Studio Version: Community</span>
          </div>
        </section>
      </div>
      {modalIsOpen && <CreateProject onClose={() => setModalIsOpen(false)} />}
      <InviteLink opened={invitationIsOpen} onClosed={() => setInvitationIsOpen(false)} />
    </main>
  );
};

HomePage.title = "Home";
HomePage.path = "/";
HomePage.exact = true;

function WorkspaceRecentGroup({ workspace, projects }: { workspace: APIWorkspace; projects: APIProject[] }) {
  const white = "#FFFFFF";
  const color = workspace.color && workspace.color !== white ? workspace.color : undefined;

  return (
    <div>
      <Link
        to="/workspaces"
        className="flex items-center gap-2 mb-1 px-1 text-neutral-content-subtle hover:text-neutral-content"
        data-external
      >
        <IconGrid className="w-4 h-4 shrink-0" style={color ? { color } : undefined} />
        <span className="font-semibold text-sm truncate">{workspace.title}</span>
        <span className="text-xs text-neutral-content-subtler ml-auto shrink-0">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
      </Link>
      <div className="flex flex-col gap-0.5 pl-6">
        {projects.map((project) => (
          <ProjectSimpleCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectSimpleCard({ project }: { project: APIProject }) {
  const finished = project.finished_task_number ?? 0;
  const total = project.task_number ?? 0;
  const progress = (total > 0 ? finished / total : 0) * 100;
  const white = "#FFFFFF";
  const color = project.color && project.color !== white ? project.color : "#E1DED5";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block even:bg-neutral-surface rounded-sm overflow-hidden"
      data-external
    >
      <div
        className="grid grid-cols-[minmax(0,1fr)_150px] p-2 py-3 items-center border-l-[3px]"
        style={{ borderLeftColor: color }}
      >
        <div className="flex flex-col gap-1">
          <Tooltip title={project.title}>
            <span className="text-neutral-content truncate">{project.title}</span>
          </Tooltip>
          <div className="text-neutral-content-subtler text-sm">
            {finished} of {total} Tasks ({total > 0 ? Math.round((finished / total) * 100) : 0}%)
          </div>
        </div>
        <div className="bg-neutral-surface rounded-full overflow-hidden w-full h-2 shadow-neutral-border-subtle shadow-border-1">
          <div className="bg-positive-surface-hover h-full" style={{ maxWidth: `${progress}%` }} />
        </div>
      </div>
    </Link>
  );
}
