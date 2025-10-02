// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Pages
import Register from "../pages/Register";
import HomeTenant from "../pages/HomeTenant";
import HomeProjects from "../pages/HomeProjects";

// Projects
import CreateProject from "../pages/projects/CreateProject";
import HomeProject from "../pages/projects/HomeProject";
import ProjectSettings from "../pages/projects/ProjectSettings";
import EditDetails from "../pages/projects/EditDetails";
import ItemTypeSetEdit from "../pages/projects/ItemTypeSetEdit";


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
import FieldConfigurationCreate from "../pages/fieldconfigurations/FieldConfigurationCreate";

// Field Sets
import FieldSets from "../pages/fieldsets/FieldSets";
import FieldSetCreate from "../pages/fieldsets/FieldSetCreate";
import EditFieldSets from "../pages/fieldsets/EditFieldSet";

//Statuses
import Statuses from "../pages/statuses/Statuses";
import StatusEdit from "../pages/statuses/StatusEdit";

//Workflows
import Workflows from "../pages/workflows/Workflows";
import WorkflowCreate from "../pages/workflows/WorkflowCreate";
import WorkflowEdit from "../pages/workflows/WorkflowEdit";

import Test from "../pages/workflows/Test";


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

            <Route path="item-types" element={<ItemTypeList />} />
            <Route path="item-types/:itemTypeId" element={<EditItemType />} />

            <Route path="item-type-sets" element={<ItemTypeSets />} />
            <Route path="item-type-sets/edit/:id" element={<EditItemTypeSet />} />
            <Route path="item-type-sets/create" element={<ItemTypeSetCreate />} />

            <Route path="fields" element={<Fields />} />
            <Route path="fields/:id" element={<FieldEdit />} />

            <Route path="field-sets" element={<FieldSets />} />
            <Route path="field-sets/:id" element={<EditFieldSets />} />
            <Route path="field-sets/create" element={<FieldSetCreate />} />

            <Route path="field-configurations" element={<FieldConfigurations />} />
            <Route path="field-configurations/:id" element={<FieldConfigurationEdit />} />
            <Route path="field-configurations/create" element={<FieldConfigurationCreate />} />

            <Route path="statuses" element={<Statuses />} />
            <Route path="statuses/:id" element={<StatusEdit />} />

            <Route path="workflows" element={<Workflows />} />
            <Route path="workflows/create" element={<WorkflowCreate />} />
            <Route path="workflows/:id" element={<WorkflowEdit />} />

            <Route path="test" element={<Test />} />
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
          <Route path="create" element={<CreateProject />} />
          <Route path=":projectId" element={<HomeProject />} />

          <Route path=":projectId/settings" element={<ProjectSettings />} />
          <Route path=":projectId/settings/details" element={<EditDetails />} />
          <Route path=":projectId/settings/item-type-set/:itemTypeSetId" element={<ItemTypeSetEdit />} />

        </Route>


    </Routes>
  );
}
