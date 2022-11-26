import React, { Component } from "react";
import { classNames } from "primereact/utils";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import http from "../http-service";
import config from "../config.json";
import { FilterMatchMode, FilterOperator } from "primereact/api";

class Pets extends Component {
  state = {
    pet: {
      id: null,
      name: "",
      description: "",
    },
    pets: [],
    petDialog: false,
    deletePetDialog: false,
    deletePetsDialog: false,
    selectedPets: null,
    submitted: false,
    globalFilterValue: "",
    dt: null,
    new: true,
    filters: null,
  };

  cols = [
    { field: "id", header: "Id" },
    { field: "name", header: "Name" },
    { field: "description", header: "Description" },
  ];

  exportColumns = () =>
    this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));

  async componentDidMount() {
    const { data: pets } = await http.get(config.baseUrl + "/api/v1/pet");
    this.setState({ pets });
    this.initFilters();
  }

  openNew = () => {
    this.setState({
      pet: {
        id: null,
        name: "",
        description: "",
      },
      submitted: false,
      petDialog: true,
      new: true,
    });
  };

  hideDialog = () => {
    this.setState({ submitted: false, petDialog: false });
  };

  hideDeletePetDialog = () => {
    this.setState({ deletePetDialog: false });
  };

  hideDeletePetsDialog = () => {
    this.setState({ deletePetsDialog: false });
  };

  savePet = async () => {
    try {
      if (this.state.new) {
        const { data: pet } = await http.post(
          config.baseUrl + "/api/v1/pet",
          this.state.pet
        );

        const pets = [pet, ...this.state.pets];
        this.setState({ pets, submitted: true, petDialog: false });
        this.toast.show({
          severity: "success",
          summary: "Successful",
          detail: "Pet has been successfully saved.",
          life: 3000,
        });
      } else {
        await http.put(
          config.baseUrl + "/api/v1/pet/id/" + this.state.pet.id,
          this.state.pet
        );
        const index = this.findIndexById(this.state.pet.id);
        const newPets = [...this.state.pets];
        newPets[index] = this.state.pet;
        this.setState({ pets: newPets, submitted: true, petDialog: false });

        this.toast.show({
          severity: "success",
          summary: "Successful",
          detail: "Pet has been successfully updated.",
          life: 3000,
        });
      }
    } catch (ex) {
      this.setState({ submitted: true, petDialog: false });
      this.toast.show({
        severity: "error",
        summary: "Error!",
        detail: "An unexpected error occured.",
        life: 3000,
      });
    }
  };

  editPet = (pet) => {
    this.setState({ pet: { ...pet }, petDialog: true, new: false });
  };

  confirmDeletePet = (pet) => {
    this.setState({ pet, deletePetDialog: true });
  };

  deletePet = async () => {
    let _pets = this.state.pets.filter(
      (val) => val.id !== this.state.selectedPets.id
    );
    this.setState({
      pets: _pets,
      deletePetDialog: false,
    });

    try {
      await http.delete(
        config.baseUrl + "/api/v1/pet/id/" + this.state.selectedPets.id
      );

      this.toast.show({
        severity: "success",
        summary: "Successful",
        detail: "Pet has been successfully deleted.",
        life: 3000,
      });
    } catch (ex) {
      this.toast.show({
        severity: "error",
        summary: "Error!",
        detail: "An unexpected error occured.",
        life: 3000,
      });
    }
  };

  findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < this.state.pets.length; i++) {
      if (this.state.pets[i].id === id) {
        index = i;
        break;
      }
    }

    return index;
  };

  confirmDeleteSelected = () => {
    this.setState({ deletePetsDialog: true });
  };

  onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _pet = { ...this.state.pet };
    _pet[`${name}`] = val;

    this.setState({ pet: _pet });
  };

  actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          disabled={rowData !== this.state.selectedPets}
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success mr-2"
          onClick={() => this.editPet(rowData)}
        />
        <Button
          disabled={rowData !== this.state.selectedPets}
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => this.confirmDeletePet(rowData)}
        />
      </React.Fragment>
    );
  };

  header = () => {
    return (
      <div className="flex flex-column md:flex-row md:align-items-center justify-content-between">
        <div className="flex justify-content-between">
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Clear"
            className="p-button-outlined"
            onClick={this.clearFilter}
          />
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={this.state.globalFilterValue}
              onChange={this.onGlobalFilterChange}
              placeholder="Global Search..."
            />
          </span>
        </div>
        <div className="mt-3 md:mt-0 flex justify-content-end">
          <Button
            icon="pi pi-plus"
            className="mr-2 p-button-rounded"
            onClick={this.openNew}
            tooltip="New Pet"
            tooltipOptions={{ position: "bottom" }}
          />
          <Button
            type="button"
            icon="pi pi-file-excel"
            onClick={this.exportExcel}
            className="p-button-success mr-2"
            tooltip="Export to Excel"
            tooltipOptions={{ position: "bottom" }}
          />
          <Button
            type="button"
            icon="pi pi-file-pdf"
            onClick={this.exportPdf}
            className="p-button-danger mr-2"
            tooltip="Export to PDF"
            tooltipOptions={{ position: "bottom" }}
          />
        </div>
      </div>
    );
  };

  exportPdf = () => {
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then(() => {
        const doc = new jsPDF.default(0, 0);
        doc.autoTable({
          //  columnStyles: { europe: { halign: "center" } }, // European countries centered
          body: this.state.pets,
          columns: [
            { header: "Id", dataKey: "id" },
            { header: "Name", dataKey: "name" },
            { header: "Description", dataKey: "description" },
          ],
        });
        const date = new Date();
        doc.save("Pets_export_" + date.getTime() + ".pdf");
      });
    });
  };

  exportExcel = () => {
    import("xlsx").then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(this.state.pets);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      this.saveAsExcelFile(excelBuffer, "Pets");
    });
  };

  saveAsExcelFile = (buffer, fileName) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        let EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  };

  petDialogFooter = () => {
    return (
      <React.Fragment>
        <Button
          label="Cancel"
          icon="pi pi-times"
          className="p-button-text"
          onClick={this.hideDialog}
        />
        <Button label="Save" icon="pi pi-check" onClick={this.savePet} />
      </React.Fragment>
    );
  };

  deletePetDialogFooter = () => {
    return (
      <React.Fragment>
        <Button
          label="No"
          icon="pi pi-times"
          className="p-button-text"
          onClick={this.hideDeletePetDialog}
        />
        <Button
          label="Yes"
          icon="pi pi-check"
          className="p-button-text"
          onClick={this.deletePet}
        />
      </React.Fragment>
    );
  };

  deletePetsDialogFooter = () => {
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={this.hideDeletePetsDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-text"
        onClick={this.deleteSelectedPets}
      />
    </React.Fragment>;
  };

  initFilters = () => {
    this.setState({
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        description: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      },
    });
  };

  clearFilter = () => {
    this.setState({ globalFilterValue: "" });
    this.initFilters();
  };

  onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...this.state.filters };
    _filters["global"].value = value;

    this.setState({ filters: _filters, globalFilterValue: value });
  };

  render() {
    return (
      <div className="datatable-crud-demo surface-card p-4 border-round shadow-2">
        <Toast ref={(el) => (this.toast = el)} />

        <div className="text-3xl text-800 font-bold mb-4">
          Pet Shop Demo{" "}
          <span className="font-normal text-600 text-sm">
            <i>Author: Houwaey-</i>
          </span>
        </div>

        <DataTable
          id="petsTable"
          ref={this.state.dt}
          value={this.state.pets}
          selection={this.state.selectedPets}
          onSelectionChange={(e) => this.setState({ selectedPets: e.value })}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
          header={this.header}
          responsiveLayout="stack"
          stripedRows
          emptyMessage="No Pets found."
          filters={this.state.filters}
          filterDisplay="menu"
          globalFilterFields={["id", "name", "description"]}
          removableSort
        >
          <Column
            selectionMode="single"
            headerStyle={{ width: "3rem" }}
            exportable={false}
          ></Column>
          <Column
            field="id"
            header="Id"
            sortable
            style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            field="name"
            header="Name"
            sortable
            style={{ minWidth: "16rem" }}
          ></Column>
          <Column
            field="description"
            header="Description"
            sortable
            style={{ minWidth: "10rem" }}
          ></Column>
          <Column
            body={this.actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "8rem" }}
          ></Column>
        </DataTable>

        <Dialog
          visible={this.state.petDialog}
          breakpoints={{ "960px": "75vw", "640px": "100vw" }}
          style={{ width: "40vw" }}
          header="Pet Details"
          modal
          className="p-fluid"
          footer={this.petDialogFooter}
          onHide={this.hideDialog}
        >
          <div className="field">
            <label htmlFor="name">Name</label>
            <InputText
              id="name"
              value={this.state.pet.name}
              onChange={(e) => this.onInputChange(e, "name")}
              required
              autoFocus
              className={classNames({
                "p-invalid": this.state.submitted && !this.state.pet.name,
              })}
            />
            {this.state.submitted && !this.state.pet.name && (
              <small className="p-error">Name is required.</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <InputTextarea
              id="description"
              value={this.state.pet.description}
              onChange={(e) => this.onInputChange(e, "description")}
              required
              rows={3}
              cols={20}
            />
          </div>
        </Dialog>

        <Dialog
          visible={this.state.deletePetDialog}
          style={{ width: "450px" }}
          header="Confirm"
          modal
          footer={this.deletePetDialogFooter}
          onHide={this.hideDeletePetDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {this.state.pet && (
              <span>
                Are you sure you want to delete <b>{this.state.pet.name}</b>?
              </span>
            )}
          </div>
        </Dialog>
      </div>
    );
  }
}

export default Pets;
