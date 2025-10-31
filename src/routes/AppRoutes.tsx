import { Routes, Route } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Pages
import Register from "../pages/Register";
import HomeTenant from "../pages/HomeTenant";
import HomeProjects from "../pages/HomeProjects";

// Projects
import HomeProject from "../pages/projects/HomeProject";
import ProjectSettings from "../pages/projects/ProjectSettings";
import EditDetails from "../pages/projects/EditDetails";
import ItemTypeSetEdit from "../pages/projects/ItemTypeSetEdit";
import ProjectMembers from "../pages/projects/ProjectMembers";
import ProjectFieldConfigurations from "../pages/projects/ProjectFieldConfigurations";
import ProjectFieldConfigurationCreate from "../pages/projects/ProjectFieldConfigurationCreate";
import ProjectFieldConfigurationEdit from "../pages/projects/ProjectFieldConfigurationEdit";
import ProjectFieldSets from "../pages/projects/ProjectFieldSets";
import ProjectFieldSetCreate from "../pages/projects/ProjectFieldSetCreate";
import ProjectFieldSetEdit from "../pages/projects/ProjectFieldSetEdit";
import ProjectFieldConfigurationsLanding from "../pages/projects/ProjectFieldConfigurationsLanding";
import ProjectWelcome from "../pages/projects/ProjectWelcome";
import ProjectLayout from "../components/ProjectLayout";

// Item Types
import ItemTypeList from "../pages/itemtypes/ItemTypes";
import EditItemType from "../pages/itemtypes/EditItemType";

// Item Type Sets
import ItemTypeSets from "../pages/itemtypesets/ItemTypeSets";
import ItemTypeSetCreate from "../pages/itemtypesets/ItemTypeSetCreate";
import EditItemTypeSet from "../pages/itemtypesets/EditItemTypeSet";

// Fields
import Fields from "../pages/fields/Fields";
import FieldEdit from "../pages/fields/FieldEdit";

// Field Configurations
import FieldConfigurations from "../pages/fieldconfigurations/FieldConfigurations";
import FieldConfigurationEdit from "../pages/fieldconfigurations/FieldConfigurationEdit";
import FieldConfigurationEditUniversal from "../pages/fieldconfigurations/FieldConfigurationEditUniversal";
import FieldConfigurationCreate from "../pages/fieldconfigurations/FieldConfigurationCreate";

// Field Sets
import FieldSets from "../pages/fieldsets/FieldSets";
import FieldSetCreate from "../pages/fieldsets/FieldSetCreate";
import EditFieldSets from "../pages/fieldsets/EditFieldSet";

// Statuses
import Statuses from "../pages/statuses/Statuses";
import StatusEdit from "../pages/statuses/StatusEdit";

// Workflows
import Workflows from "../pages/workflows/Workflows";
import WorkflowEditor from "../pages/workflows/WorkflowEditor";

// Roles
import Roles from "../pages/roles/Roles";
import CreateRole from "../pages/roles/CreateRole";
import EditRole from "../pages/roles/EditRole";

// Groups
import Groups from "../pages/groups/Groups";

// Tenant User Management
import TenantUserManagement from "../pages/tenantusers/TenantUserManagement";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />

      <Route
        path="/tenant"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomeTenant />} />

        {/* Fields, Status, Item types: Tenant Admin OR any Project Admin */}
        <Route path="item-types" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ItemTypeList />
          </RoleProtectedRoute>
        } />
        <Route path="item-types/:itemTypeId" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <EditItemType />
          </RoleProtectedRoute>
        } />

        <Route path="fields" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <Fields />
          </RoleProtectedRoute>
        } />
        <Route path="fields/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <FieldEdit />
          </RoleProtectedRoute>
        } />

        <Route path="statuses" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <Statuses />
          </RoleProtectedRoute>
        } />
        <Route path="statuses/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <StatusEdit />
          </RoleProtectedRoute>
        } />

        {/* Field Configurations, Field Sets, Workflows, Item type Sets, Gestione Ruoli, Gruppi: Tenant Admin only */}
        <Route path="item-type-sets" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <ItemTypeSets />
          </RoleProtectedRoute>
        } />
        <Route path="item-type-sets/edit/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <EditItemTypeSet />
          </RoleProtectedRoute>
        } />
        <Route path="item-type-sets/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <ItemTypeSetCreate />
          </RoleProtectedRoute>
        } />

        <Route path="field-sets" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <FieldSets />
          </RoleProtectedRoute>
        } />
        <Route path="field-sets/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <EditFieldSets />
          </RoleProtectedRoute>
        } />
        <Route path="field-sets/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <FieldSetCreate />
          </RoleProtectedRoute>
        } />

        <Route path="field-configurations" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <FieldConfigurations />
          </RoleProtectedRoute>
        } />
        <Route path="field-configurations/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <FieldConfigurationEditUniversal scope="tenant" />
          </RoleProtectedRoute>
        } />
        <Route path="field-configurations/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <FieldConfigurationCreate />
          </RoleProtectedRoute>
        } />

        <Route path="workflows" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <Workflows />
          </RoleProtectedRoute>
        } />
        <Route path="workflows/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <WorkflowEditor />
          </RoleProtectedRoute>
        } />
        <Route path="workflows/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <WorkflowEditor />
          </RoleProtectedRoute>
        } />

        <Route path="roles" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <Roles />
          </RoleProtectedRoute>
        } />
        <Route path="roles/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <CreateRole />
          </RoleProtectedRoute>
        } />
        <Route path="roles/edit/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <EditRole />
          </RoleProtectedRoute>
        } />

        <Route path="groups" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <Groups />
          </RoleProtectedRoute>
        } />
        
        <Route path="users" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" }
          ]}>
            <TenantUserManagement />
          </RoleProtectedRoute>
        } />
        
      </Route>

      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomeProjects />} />
      </Route>

      {/* Route separate per i progetti specifici con la loro navbar */}
      <Route
        path="/projects/:projectId"
        element={
          <PrivateRoute>
            <ProjectLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ProjectWelcome />} />

        <Route path="settings" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectSettings />
          </RoleProtectedRoute>
        } />
        <Route path="settings/details" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <EditDetails />
          </RoleProtectedRoute>
        } />
        <Route path="settings/item-type-set/:itemTypeSetId" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ItemTypeSetEdit />
          </RoleProtectedRoute>
        } />
        <Route path="settings/members" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectMembers />
          </RoleProtectedRoute>
        } />

        {/* Field Configurations del Progetto */}
        <Route path="field-configurations/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectFieldConfigurationCreate />
          </RoleProtectedRoute>
        } />
        <Route path="field-configurations/edit/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectFieldConfigurationEdit />
          </RoleProtectedRoute>
        } />
        <Route path="field-configurations" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectFieldConfigurations />
          </RoleProtectedRoute>
        } />

        {/* Field Sets del Progetto */}
        <Route path="field-sets/create" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectFieldSetCreate />
          </RoleProtectedRoute>
        } />
        <Route path="field-sets/:id" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectFieldSetEdit />
          </RoleProtectedRoute>
        } />
        <Route path="field-sets" element={
          <RoleProtectedRoute requiredRoles={[
            { name: "ADMIN", scope: "TENANT" },
            { name: "ADMIN", scope: "PROJECT" }
          ]}>
            <ProjectFieldSets />
          </RoleProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
