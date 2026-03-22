import { Badge, Button, Select, Typography, Tooltip, EnterpriseBadge } from "@humansignal/ui";
import { useCallback, useContext, useEffect, useState } from "react";
import { IconSpark } from "@humansignal/icons";
import { Form, Input, TextArea } from "../../components/Form";
import { RadioGroup } from "../../components/Form/Elements/RadioGroup/RadioGroup";
import { ProjectContext } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";
import { HeidiTips } from "../../components/HeidiTips/HeidiTips";
import { FF_LSDV_E_297, FF_WORKSPACES, isFF } from "../../utils/feature-flags";
import { createURL } from "../../components/HeidiTips/utils";
import { useAPI } from "../../providers/ApiProvider";

const SORTED_SAMPLING = "Sorted sequential sampling";

const DIRECTION_OPTIONS = [
  { value: "asc", label: "A → Z" },
  { value: "desc", label: "Z → A" },
];

function SortFieldsEditor({ sortFields, onChange, columnOptions }) {
  const addField = () => onChange([...sortFields, { field: "", direction: "asc" }]);
  const updateField = (index, key, val) =>
    onChange(sortFields.map((f, i) => (i === index ? { ...f, [key]: val } : f)));
  const removeField = (index) => onChange(sortFields.filter((_, i) => i !== index));

  return (
    <div
      style={{
        marginTop: 4,
        padding: "1rem",
        border: "1px solid var(--color-neutral-border)",
        borderRadius: "0.5rem",
        background: "var(--color-neutral-surface)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-neutral-content)",
          marginBottom: sortFields.length > 0 ? "0.75rem" : "0.5rem",
        }}
      >
        Sort fields{" "}
        <span style={{ fontWeight: 400, color: "var(--color-neutral-content-subtler)" }}>
          — applied in order
        </span>
      </div>

      {sortFields.length === 0 && (
        <div
          style={{
            fontSize: 14,
            color: "var(--color-neutral-content-subtler)",
            marginBottom: "0.75rem",
          }}
        >
          No fields configured — tasks will fall back to ID ordering.
        </div>
      )}

      {sortFields.map((spec, index) => (
        <div
          key={index}
          style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}
        >
          <span
            style={{
              minWidth: 18,
              fontSize: 12,
              color: "var(--color-neutral-content-subtler)",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {index + 1}.
          </span>
          <Select
            options={columnOptions}
            value={spec.field || null}
            placeholder="Select a field…"
            searchable
            searchPlaceholder="Search fields…"
            onChange={(val) => updateField(index, "field", val ?? "")}
            style={{ flex: 1 }}
          />
          <Select
            options={DIRECTION_OPTIONS}
            value={spec.direction}
            onChange={(val) => updateField(index, "direction", val)}
            style={{ width: 110, flexShrink: 0 }}
          />
          <Button
            type="button"
            look="string"
            size="small"
            onClick={() => removeField(index)}
            style={{ color: "var(--color-neutral-content-subtler)", flexShrink: 0, padding: "0 4px" }}
          >
            ✕
          </Button>
        </div>
      ))}

      <Button type="button" look="outlined" size="small" onClick={addField} style={{ marginTop: 4 }}>
        + Add field
      </Button>
    </div>
  );
}

export const GeneralSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);
  const api = useAPI();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(project.workspace ?? null);
  const [currentSampling, setCurrentSampling] = useState(project.sampling ?? "Sequential sampling");
  const [sortFields, setSortFields] = useState(project.sampling_sort_fields ?? []);
  const [columnOptions, setColumnOptions] = useState([]);

  useEffect(() => {
    if (isFF(FF_WORKSPACES)) {
      api.callApi("workspaces").then((data) => {
        setWorkspaces(data?.results ?? data ?? []);
      });
    }
  }, []);

  useEffect(() => {
    if (!project.id) return;
    api.callApi("dmColumns", { params: { project: project.id } }).then((data) => {
      const opts = (data?.columns ?? [])
        .filter((c) => c.parent === "data")
        .map((c) => ({ value: c.id, label: c.title ?? c.id }));
      setColumnOptions(opts);
    });
  }, [project.id]);

  useEffect(() => {
    setSelectedWorkspace(project.workspace ?? null);
  }, [project.workspace]);

  useEffect(() => {
    setCurrentSampling(project.sampling ?? "Sequential sampling");
    setSortFields(project.sampling_sort_fields ?? []);
  }, [project.sampling, project.sampling_sort_fields]);

  const updateProject = useCallback(async () => {
    if (!project.id) return;
    // Save sampling_sort_fields whenever the main form saves
    await api.callApi("updateProject", {
      params: { pk: project.id },
      body: { sampling_sort_fields: sortFields },
    });
    fetchProject(project.id, true);
  }, [project, sortFields]);

  const colors = ["#FDFDFC", "#FF4C25", "#FF750F", "#ECB800", "#9AC422", "#34988D", "#617ADA", "#CC6FBE"];

  const samplings = [
    { value: "Sequential", label: "Sequential", description: "Tasks are ordered by Task ID" },
    { value: "Uniform", label: "Random", description: "Tasks are chosen with uniform random" },
    { value: "Sorted sequential", label: "Sorted sequential", description: "Tasks are sorted by specified task data fields" },
  ];

  const workspaceOptions = [
    { label: "No Workspace", value: "" },
    ...workspaces.map((ws) => ({ label: ws.title, value: String(ws.id) })),
  ];

  return (
    <div className={cn("general-settings").toClassName()}>
      <div className={cn("general-settings").elem("wrapper").toClassName()}>
        <h1>General Settings</h1>
        <div className={cn("settings-wrapper").toClassName()}>
          <Form action="updateProject" formData={{ ...project }} params={{ pk: project.id }} onSubmit={updateProject}>
            <Form.Row columnCount={1} rowGap="16px">
              <Input name="title" label="Project Name" />

              <TextArea name="description" label="Description" style={{ minHeight: 128 }} />
              {isFF(FF_WORKSPACES) ? (
                <div>
                  <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Workspace</label>
                  <Select
                    name="workspace"
                    options={workspaceOptions}
                    value={selectedWorkspace !== null ? String(selectedWorkspace) : ""}
                    onChange={(val) => setSelectedWorkspace(val || null)}
                    placeholder="No Workspace"
                  />
                </div>
              ) : isFF(FF_LSDV_E_297) && (
                <div className={cn("workspace-placeholder").toClassName()}>
                  <div className={cn("workspace-placeholder").elem("badge-wrapper").toClassName()}>
                    <div className={cn("workspace-placeholder").elem("title").toClassName()}>Workspace</div>
                    <EnterpriseBadge size="small" className="ml-2" />
                  </div>
                  <Select placeholder="Select an option" disabled options={[]} />
                  <Typography size="small" className="my-tight">
                    Simplify project management by organizing projects into workspaces.{" "}
                    <a
                      target="_blank"
                      href={createURL(
                        "https://docs.humansignal.com/guide/manage_projects#Create-workspaces-to-organize-projects",
                        {
                          experiment: "project_settings_tip",
                          treatment: "simplify_project_management",
                        },
                      )}
                      rel="noreferrer"
                      className="underline hover:no-underline"
                    >
                      Learn more
                    </a>
                  </Typography>
                </div>
              )}
              <RadioGroup name="color" label="Color" size="large" labelProps={{ size: "large" }}>
                {colors.map((color) => (
                  <RadioGroup.Button key={color} value={color}>
                    <div className={cn("color").toClassName()} style={{ "--background": color }} />
                  </RadioGroup.Button>
                ))}
              </RadioGroup>

              <RadioGroup
                label="Task Sampling"
                labelProps={{ size: "large" }}
                name="sampling"
                simple
                onChange={(value) => setCurrentSampling(value)}
              >
                {samplings.map(({ value, label, description }) => (
                  <RadioGroup.Button
                    key={value}
                    value={`${value} sampling`}
                    label={`${label} sampling`}
                    description={description}
                  />
                ))}
                {isFF(FF_LSDV_E_297) && (
                  <RadioGroup.Button
                    key="uncertainty-sampling"
                    value=""
                    label={
                      <>
                        Uncertainty sampling{" "}
                        <Tooltip title="Available on Label Studio Enterprise">
                          <Badge
                            variant="enterprise"
                            icon={<IconSpark />}
                            size="small"
                            style="ghost"
                            className="ml-tightest"
                          />
                        </Tooltip>
                      </>
                    }
                    disabled
                    description={
                      <>
                        Tasks are chosen according to model uncertainty score (active learning mode).{" "}
                        <a
                          target="_blank"
                          href={createURL("https://docs.humansignal.com/guide/active_learning", {
                            experiment: "project_settings_workspace",
                            treatment: "workspaces",
                          })}
                          rel="noreferrer"
                        >
                          Learn more
                        </a>
                      </>
                    }
                  />
                )}
              </RadioGroup>

              {currentSampling === SORTED_SAMPLING && (
                <SortFieldsEditor sortFields={sortFields} onChange={setSortFields} columnOptions={columnOptions} />
              )}
            </Form.Row>

            <Form.Actions>
              <Form.Indicator>
                <span case="success">Saved!</span>
              </Form.Indicator>
              <Button type="submit" className="w-[150px]" aria-label="Save general settings">
                Save
              </Button>
            </Form.Actions>
          </Form>
        </div>
      </div>
      {isFF(FF_LSDV_E_297) && <HeidiTips collection="projectSettings" />}
    </div>
  );
};

GeneralSettings.menuItem = "General";
GeneralSettings.path = "/";
GeneralSettings.exact = true;
