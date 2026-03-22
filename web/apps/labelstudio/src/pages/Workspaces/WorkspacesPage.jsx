import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { NavLink } from "react-router-dom";
import { Button } from "@humansignal/ui";
import { Modal } from "../../components/Modal/Modal";
import { Input } from "../../components/Form";
import { useAPI } from "../../providers/ApiProvider";
import { cn } from "../../utils/bem";
import { IconCheck, IconEllipsis, IconMinus, IconSparks } from "@humansignal/icons";
import { Dropdown } from "@humansignal/ui";
import { Menu } from "../../components";
import "./WorkspacesPage.prefix.css";

// ─── Workspace card (column header) ─────────────────────────────────────────

const WorkspaceColumn = ({ workspace, projects, onEdit, onDelete, children }) => {
  const style = workspace
    ? { "--ws-color": workspace.color, "--ws-color-light": workspace.color + "33" }
    : {};

  return (
    <div className={cn("ws-column").toClassName()} style={style}>
      <div className={cn("ws-column").elem("header").toClassName()}>
        {workspace ? (
          <>
            <div className={cn("ws-column").elem("dot").toClassName()} />
            <span className={cn("ws-column").elem("title").toClassName()}>{workspace.title}</span>
            <span className={cn("ws-column").elem("count").toClassName()}>
              {projects.length}
            </span>
            <div
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className={cn("ws-column").elem("menu").toClassName()}
            >
              <Dropdown.Trigger
                content={
                  <Menu contextual>
                    <Menu.Item onClick={() => onEdit(workspace)}>Edit</Menu.Item>
                    <Menu.Item onClick={() => onDelete(workspace)} danger>Delete</Menu.Item>
                  </Menu>
                }
              >
                <Button size="smaller" look="string" aria-label="Workspace options">
                  <IconEllipsis />
                </Button>
              </Dropdown.Trigger>
            </div>
          </>
        ) : (
          <>
            <span className={cn("ws-column").elem("title").toClassName()}>No Workspace</span>
            <span className={cn("ws-column").elem("count").toClassName()}>
              {projects.length}
            </span>
          </>
        )}
      </div>
      {children}
    </div>
  );
};

// ─── Mini project card (Kanban tile) ────────────────────────────────────────

const ProjectTile = ({ project, index }) => (
  <Draggable draggableId={String(project.id)} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={cn("ws-tile").mod({ dragging: snapshot.isDragging }).toClassName()}
      >
        <NavLink
          className={cn("ws-tile").elem("link").toClassName()}
          to={`/projects/${project.id}/data`}
          data-external
          onClick={(e) => snapshot.isDragging && e.preventDefault()}
        >
          <div className={cn("ws-tile").elem("title").toClassName()}>{project.title || "Untitled"}</div>
          <div className={cn("ws-tile").elem("stats").toClassName()}>
            <span title="Annotations">
              <IconCheck style={{ width: 12, height: 12 }} /> {project.total_annotations_number ?? 0}
            </span>
            <span title="Skipped">
              <IconMinus style={{ width: 12, height: 12 }} /> {project.skipped_annotations_number ?? 0}
            </span>
            <span title="Predictions">
              <IconSparks style={{ width: 12, height: 12 }} /> {project.total_predictions_number ?? 0}
            </span>
          </div>
        </NavLink>
      </div>
    )}
  </Draggable>
);

// ─── Create / Edit workspace modal ──────────────────────────────────────────

const WorkspaceModal = ({ workspace, onSave, onClose }) => {
  const [title, setTitle] = useState(workspace?.title ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [color, setColor] = useState(workspace?.color ?? "#FFFFFF");

  const COLORS = ["#FFFFFF", "#FF4C25", "#FF750F", "#ECB800", "#9AC422", "#34988D", "#617ADA", "#CC6FBE"];

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, color });
  };

  return (
    <Modal
      visible
      title={workspace ? "Edit Workspace" : "Create Workspace"}
      onHide={onClose}
      footer={
        <>
          <Button look="outlined" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{workspace ? "Save" : "Create"}</Button>
        </>
      }
    >
      <div className={cn("ws-modal").toClassName()}>
        <label className={cn("ws-modal").elem("label").toClassName()}>Name</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Workspace name"
          autoFocus
        />
        <label className={cn("ws-modal").elem("label").toClassName()}>Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
        <label className={cn("ws-modal").elem("label").toClassName()}>Color</label>
        <div className={cn("ws-modal").elem("colors").toClassName()}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn("ws-modal").elem("color").mod({ selected: color === c }).toClassName()}
              style={{ background: c, border: color === c ? "2px solid #333" : "2px solid #ccc" }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

export const WorkspacesPage = () => {
  const api = useAPI();
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalWorkspace, setModalWorkspace] = useState(null); // null = closed, false = create, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [wsData, projData] = await Promise.all([
      api.callApi("workspaces"),
      api.callApi("projects", {
        params: {
          page_size: 1000,
          include: [
            "id", "title", "workspace",
            "total_annotations_number", "skipped_annotations_number", "total_predictions_number",
          ].join(","),
        },
      }),
    ]);
    setWorkspaces(wsData?.results ?? wsData ?? []);
    setProjects(projData?.results ?? []);
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // Group projects by workspace
  const projectsByWorkspace = React.useMemo(() => {
    const map = { none: [] };
    for (const ws of workspaces) map[ws.id] = [];
    for (const p of projects) {
      const key = p.workspace ?? "none";
      if (map[key] !== undefined) map[key].push(p);
      else map["none"].push(p);
    }
    return map;
  }, [workspaces, projects]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const projectId = parseInt(draggableId);
    const newWorkspaceId = destination.droppableId === "none" ? null : parseInt(destination.droppableId);

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, workspace: newWorkspaceId } : p)),
    );

    await api.callApi("updateProject", {
      params: { pk: projectId },
      body: { workspace: newWorkspaceId },
    });
  };

  const handleCreateWorkspace = async (data) => {
    await api.callApi("createWorkspace", { body: data });
    setModalWorkspace(null);
    load();
  };

  const handleEditWorkspace = async (data) => {
    await api.callApi("updateWorkspace", {
      params: { pk: modalWorkspace.id },
      body: data,
    });
    setModalWorkspace(null);
    load();
  };

  const handleDeleteWorkspace = async () => {
    await api.callApi("deleteWorkspace", { params: { pk: deleteTarget.id } });
    setDeleteTarget(null);
    load();
  };

  const columns = [
    ...workspaces,
    null, // "No Workspace" column
  ];

  return (
    <div className={cn("workspaces-page").toClassName()}>
      <div className={cn("workspaces-page").elem("toolbar").toClassName()}>
        <h1>Workspaces</h1>
        <Button onClick={() => setModalWorkspace(false)} size="small">Create Workspace</Button>
      </div>

      {loading ? (
        <div className={cn("workspaces-page").elem("loading").toClassName()}>Loading…</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={cn("workspaces-page").elem("board").toClassName()}>
            {columns.map((ws) => {
              const key = ws ? String(ws.id) : "none";
              const colProjects = projectsByWorkspace[ws?.id ?? "none"] ?? [];
              return (
                <WorkspaceColumn
                  key={key}
                  workspace={ws}
                  projects={colProjects}
                  onEdit={(w) => setModalWorkspace(w)}
                  onDelete={(w) => setDeleteTarget(w)}
                >
                  <Droppable droppableId={key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn("ws-column")
                          .elem("list")
                          .mod({ over: snapshot.isDraggingOver })
                          .toClassName()}
                      >
                        {colProjects.map((p, i) => (
                          <ProjectTile key={p.id} project={p} index={i} />
                        ))}
                        {provided.placeholder}
                        {colProjects.length === 0 && (
                          <div className={cn("ws-column").elem("empty").toClassName()}>
                            Drop projects here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </WorkspaceColumn>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {modalWorkspace !== null && (
        <WorkspaceModal
          workspace={modalWorkspace || null}
          onSave={modalWorkspace ? handleEditWorkspace : handleCreateWorkspace}
          onClose={() => setModalWorkspace(null)}
        />
      )}

      {deleteTarget && (
        <Modal
          visible
          title="Delete Workspace"
          onHide={() => setDeleteTarget(null)}
          footer={
            <>
              <Button look="outlined" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button look="destructive" onClick={handleDeleteWorkspace}>Delete</Button>
            </>
          }
        >
          <p>
            Delete workspace <strong>{deleteTarget.title}</strong>? Projects inside will be moved to "No Workspace".
          </p>
        </Modal>
      )}
    </div>
  );
};

WorkspacesPage.title = "Workspaces";
WorkspacesPage.path = "/workspaces";
WorkspacesPage.exact = true;
WorkspacesPage.icon = null;
