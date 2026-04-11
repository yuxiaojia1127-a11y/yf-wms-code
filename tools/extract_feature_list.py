from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
from xml.etree import ElementTree as ET
from zipfile import ZipFile


WB_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKGREL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def _col_to_idx(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n


def _a1_to_rc(a1: str) -> Tuple[int, int] | None:
    m = re.match(r"^([A-Z]+)(\d+)$", a1)
    if not m:
        return None
    return int(m.group(2)), _col_to_idx(m.group(1))


def _read_xml(z: ZipFile, name: str) -> ET.Element:
    return ET.fromstring(z.read(name))


def _load_shared_strings(z: ZipFile) -> List[str]:
    sst = _read_xml(z, "xl/sharedStrings.xml")
    shared: List[str] = []
    for si in sst.findall(f"{{{WB_NS}}}si"):
        texts: List[str] = []
        for t in si.findall(f".//{{{WB_NS}}}t"):
            texts.append(t.text or "")
        shared.append("".join(texts))
    return shared


def _load_sheet_cells(z: ZipFile, sheet_xml: str, shared: List[str]) -> Dict[Tuple[int, int], str]:
    root = _read_xml(z, sheet_xml)
    cells: Dict[Tuple[int, int], str] = {}

    for c in root.findall(f".//{{{WB_NS}}}sheetData//{{{WB_NS}}}c"):
        ref = c.attrib.get("r")
        rc = _a1_to_rc(ref) if ref else None
        if not rc:
            continue
        r, ci = rc
        t = c.attrib.get("t")
        v_el = c.find(f"{{{WB_NS}}}v")
        is_el = c.find(f"{{{WB_NS}}}is")

        val = ""
        if t == "s" and v_el is not None and v_el.text is not None:
            idx = int(v_el.text)
            val = shared[idx] if 0 <= idx < len(shared) else ""
        elif t == "inlineStr" and is_el is not None:
            texts = [(t.text or "") for t in is_el.findall(f".//{{{WB_NS}}}t")]
            val = "".join(texts)
        elif v_el is not None and v_el.text is not None:
            val = v_el.text

        cells[(r, ci)] = val

    return cells


@dataclass(frozen=True)
class Sheet:
    name: str
    xml_path: str


def _list_sheets(z: ZipFile) -> List[Sheet]:
    wb = _read_xml(z, "xl/workbook.xml")
    rels = _read_xml(z, "xl/_rels/workbook.xml.rels")

    rid_to_target: Dict[str, str] = {}
    for rel in rels.findall(f"{{{PKGREL_NS}}}Relationship"):
        rid_to_target[rel.attrib["Id"]] = rel.attrib.get("Target", "")

    sheets: List[Sheet] = []
    sheets_el = wb.find(f"{{{WB_NS}}}sheets")
    if sheets_el is None:
        return sheets

    for sh in sheets_el.findall(f"{{{WB_NS}}}sheet"):
        name = sh.attrib.get("name", "")
        rid = sh.attrib.get(f"{{{R_NS}}}id", "")
        target = rid_to_target.get(rid, "")
        if target and not target.startswith("xl/"):
            target = "xl/" + target
        if name and target:
            sheets.append(Sheet(name=name, xml_path=target))

    return sheets


def preview(xlsx_path: Path, *, max_row: int = 30, max_col: int = 18) -> None:
    with ZipFile(xlsx_path) as z:
        shared = _load_shared_strings(z)
        for sheet in _list_sheets(z):
            if sheet.name == "WpsReserved_CellImgList":
                continue
            if sheet.xml_path not in z.namelist():
                continue
            cells = _load_sheet_cells(z, sheet.xml_path, shared)
            mr = min(max((r for r, _ in cells.keys()), default=0), max_row)
            mc = min(max((c for _, c in cells.keys()), default=0), max_col)
            print(f"\n== {sheet.name} ({sheet.xml_path}) ==")
            for r in range(1, mr + 1):
                row = [str(cells.get((r, c), "") or "").strip() for c in range(1, mc + 1)]
                if any(row):
                    print(r, row)


def read_sheet_table(xlsx_path: Path, sheet_name: str) -> List[Dict[str, str]]:
    with ZipFile(xlsx_path) as z:
        shared = _load_shared_strings(z)
        sheets = _list_sheets(z)
        sheet = next((s for s in sheets if s.name == sheet_name), None)
        if sheet is None:
            raise ValueError(f"sheet_not_found: {sheet_name}")
        if sheet.xml_path not in z.namelist():
            raise ValueError(f"sheet_xml_missing: {sheet.xml_path}")

        cells = _load_sheet_cells(z, sheet.xml_path, shared)
        max_row = max((r for r, _ in cells.keys()), default=0)
        max_col = max((c for _, c in cells.keys()), default=0)
        if max_row < 1 or max_col < 1:
            return []

        header = [str(cells.get((1, c), "") or "").strip() for c in range(1, max_col + 1)]
        header = [h if h else f"列{idx}" for idx, h in enumerate(header, start=1)]

        rows: List[Dict[str, str]] = []
        for r in range(2, max_row + 1):
            values = [str(cells.get((r, c), "") or "").strip() for c in range(1, max_col + 1)]
            if not any(values):
                continue
            row = {header[i]: values[i] for i in range(min(len(header), len(values)))}
            rows.append(row)
        return rows


def main() -> None:
    xlsx_path = Path("需求文档/租车供应商管理系统功能清单.xlsx")
    preview(xlsx_path)


if __name__ == "__main__":
    main()
