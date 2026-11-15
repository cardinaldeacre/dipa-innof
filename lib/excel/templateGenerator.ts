import ExcelJS from 'exceljs';

const DROPDOWN_ENUMS: Record<string, Record<string, string[]>> = {
	'Employee Master': {
		Status: ['Active', 'Inactive'],
		'Employee Status': ['Permanent', 'Contract', 'Probation', 'Internship'],
		'Employment Type': ['Full-time', 'Part-time', 'Contract', 'Internship'],
		'Job Level': [
			'Intern',
			'Junior Staff',
			'Staff',
			'Senior Staff',
			'Junior Lead',
			'Senior Lead',
			'Needs Confirmation',
		],
		'Job Level Basis': ['Derived', 'Confirmed by P&C', 'Needs Confirmation'],
		Gender: ['Male', 'Female'],
		'Probation Outcome': ['Passed', 'Failed', 'Pending', 'Not Applicable'],
		'Exit Type': [
			'Voluntary',
			'Involuntary',
			'Contract Non Renewal',
			'Probation Non Continuation',
			'Other',
			'Intern Non Continuation',
		],
		'Exit Reason': [
			'Compensation',
			'Growth',
			'Role',
			'Management',
			'Workload',
			'Culture',
			'External Opportunity',
			'Personal',
			'Other',
		],
	},
	Employee_Master: {
		Status: ['Active', 'Inactive'],
		Employee_Status: ['Permanent', 'Contract', 'Probation', 'Internship'],
		Employment_Type: ['Full-time', 'Part-time', 'Contract', 'Internship'],
		Job_Level: [
			'Intern',
			'Junior Staff',
			'Staff',
			'Senior Staff',
			'Junior Lead',
			'Senior Lead',
			'Needs Confirmation',
		],
		Job_Level_Basis: ['Derived', 'Confirmed by P&C', 'Needs Confirmation'],
		Gender: ['Male', 'Female'],
		Probation_Outcome: ['Passed', 'Failed', 'Pending', 'Not Applicable'],
		Exit_Type: [
			'Voluntary',
			'Involuntary',
			'Contract Non Renewal',
			'Probation Non Continuation',
			'Other',
			'Intern Non Continuation',
		],
		Exit_Reason: [
			'Compensation',
			'Growth',
			'Role',
			'Management',
			'Workload',
			'Culture',
			'External Opportunity',
			'Personal',
			'Other',
		],
	},
	KPI_Data: {
		Score_Status: [
			'Assessed',
			'Pending Assessment',
			'Not Applicable',
			'Not Available',
			'Provisional',
		],
	},
	Behavior_Assessment: {
		Score_Status: [
			'Assessed',
			'Pending Assessment',
			'Incomplete Data',
			'Not Applicable',
			'Not Available',
		],
	},
	Skill_Map_Data: {
		Is_Applicable: ['TRUE', 'FALSE'],
		One_On_One_Confirmed: ['TRUE', 'FALSE'],
		Calibration_Status: [
			'Assessed',
			'Calibrated',
			'Pending Calibration',
			'Incomplete Data',
			'Not Applicable',
		],
	},
	'Requisition Summary': {
		Status: ['Open', 'Filled', 'On Hold', 'Cancelled'],
	},
	'Recruitment Database': {
		'Source Channel': [
			'LinkedIn',
			'JobStreet',
			'Glints',
			'Referral',
			'Website / Career Page',
			'Instagram',
			'Other',
		],
		Stage: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
	},
	'Performance Database': {
		Rating: ['Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'],
	},
	'Training Database': {
		Status: ['Completed', 'In Progress', 'Not Started'],
	},
	'Exit Interview Database': {
		'Exit Type': [
			'Voluntary',
			'Involuntary',
			'Contract Non Renewal',
			'Probation Non Continuation',
			'Other',
			'Intern Non Continuation',
		],
		Reason: [
			'Compensation',
			'Growth',
			'Role',
			'Management',
			'Workload',
			'Culture',
			'External Opportunity',
			'Personal',
			'Other',
		],
		'Regrettable Loss': ['Yes', 'No'],
	},
};

async function buildAndDownloadWorkbook(sheetsConfig: Record<string, any[]>, fileName: string) {
	const wb = new ExcelJS.Workbook();
	wb.creator = 'Dipa Inhouse People Analytics';
	wb.created = new Date();

	for (const [sheetName, rows] of Object.entries(sheetsConfig)) {
		const ws = wb.addWorksheet(sheetName, {
			views: [{state: 'frozen', ySplit: 1}],
		});

		if (rows.length === 0) continue;

		const headers = Object.keys(rows[0]);
		const isGuide = sheetName.includes('Panduan') || sheetName.includes('Guidance');

		ws.columns = headers.map((header) => {
			const maxLen = rows.reduce((max, r) => {
				const val = r[header] !== null && r[header] !== undefined ? String(r[header]) : '';
				return Math.max(max, val.length);
			}, header.length);
			return {
				header,
				key: header,
				width: Math.min(Math.max(maxLen + 5, 16), 55),
			};
		});

		rows.forEach((r) => ws.addRow(r));

		const headerRow = ws.getRow(1);
		headerRow.height = 26;
		headerRow.eachCell((cell) => {
			cell.font = {name: 'Calibri', size: 11, bold: true, color: {argb: 'FFFFFFFF'}};
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: {argb: isGuide ? 'FF1E40AF' : 'FF059669'},
			};
			cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
			cell.border = {
				top: {style: 'thin', color: {argb: 'FFD1D5DB'}},
				bottom: {style: 'thin', color: {argb: 'FFD1D5DB'}},
				left: {style: 'thin', color: {argb: 'FFD1D5DB'}},
				right: {style: 'thin', color: {argb: 'FFD1D5DB'}},
			};
		});

		for (let rIdx = 2; rIdx <= rows.length + 1; rIdx++) {
			const row = ws.getRow(rIdx);
			row.height = 20;
			row.eachCell({includeEmpty: true}, (cell) => {
				cell.font = {name: 'Calibri', size: 10, color: {argb: 'FF1F2937'}};
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: {argb: rIdx % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF'},
				};
				cell.alignment = {vertical: 'middle', horizontal: 'left', wrapText: true};
				cell.border = {
					top: {style: 'thin', color: {argb: 'FFE5E7EB'}},
					bottom: {style: 'thin', color: {argb: 'FFE5E7EB'}},
					left: {style: 'thin', color: {argb: 'FFE5E7EB'}},
					right: {style: 'thin', color: {argb: 'FFE5E7EB'}},
				};
			});
		}

		const sheetEnums = DROPDOWN_ENUMS[sheetName];
		if (sheetEnums) {
			headers.forEach((headerName, colIdx) => {
				const enumList = sheetEnums[headerName];
				if (!enumList) return;

				const colNumber = colIdx + 1;
				const formulaString = `"${enumList.join(',')}"`;

				for (let r = 2; r <= 500; r++) {
					const cell = ws.getCell(r, colNumber);
					cell.dataValidation = {
						type: 'list',
						allowBlank: true,
						formulae: [formulaString],
						showErrorMessage: false,
						showInputMessage: true,
						promptTitle: `Pilih ${headerName}`,
						prompt: 'Klik panah untuk memilih opsi standar, atau ketik manual jika diperlukan.',
					};
				}
			});
		}
	}

	const buffer = await wb.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	window.URL.revokeObjectURL(url);
}

/**
 * Generator khusus Workbook v2 (4 Sheet Import Terpisah untuk Talent Mapping Revisi 2):
 * Employee_Master, KPI_Data, Behavior_Assessment, Skill_Map_Data
 */
export async function downloadTalentMappingV2Template() {
	const sheetsConfig: Record<string, any[]> = {
		'📋 Guidance Revisi 2': [
			{
				Sheet: 'Employee_Master',
				Aturan: 'Master referensi seluruh karyawan. Mendukung Job_Level & Job_Level_Basis.',
				Catatan:
					'Employee_ID boleh kosong sementara pada sheet KPI/Behavior/Skill (dicocokkan via Employee_Name).',
			},
			{
				Sheet: 'KPI_Data',
				Aturan: 'KPI Kuartalan (YYYY-Q1 s/d YYYY-Q4), nilai 0-100 (di atas 100 invalid).',
				Catatan: 'Intern otomatis berstatus Not Applicable dan dikeluarkan dari denominator KPI.',
			},
			{
				Sheet: 'Behavior_Assessment',
				Aturan: 'Granular 7 dimensi skala 1-5, periode tahunan (2026), evaluator & evidence.',
				Catatan: 'Wajib lengkap 7 dimensi untuk menghasilkan skor (rata-rata / 5 * 100).',
			},
			{
				Sheet: 'Skill_Map_Data',
				Aturan: 'Granular per kompetensi level L1-L4 (angka 1-4): Self, Lead, Final, Target.',
				Catatan:
					'Jika |Self - Lead| >= 2 dan One_On_One_Confirmed = FALSE, otomatis menjadi Pending Calibration.',
			},
		],
		Employee_Master: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso',
				Job_Title: 'UI/UX Designer',
				Job_Level: 'Staff',
				Job_Level_Basis: 'Derived',
				Department: 'UI/UX Design',
				Status: 'Active',
				Employee_Status: 'Permanent',
				Employment_Type: 'Full-time',
				Gender: 'Male',
				Join_Date: '2026-01-15',
				Years_of_Service: 0.8,
				Probation_Start_Date: '2026-01-15',
				Probation_End_Date: '2026-04-15',
				Probation_Outcome: 'Passed',
				Contract_Start_Date: '2026-04-16',
				Exit_Date: '',
				Exit_Type: '',
				Exit_Reason: '',
			},
		],
		KPI_Data: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso',
				KPI_Period: '2026-Q2',
				KPI_Score: 92,
				Score_Status: 'Assessed',
				Notes: 'Pilot cohort UI/UX Design Q2',
				Source_File: 'KPI_UIUX_2026Q2.xlsx',
				Source_Sheet: 'KPI_Data',
				Source_Row: 2,
			},
		],
		Behavior_Assessment: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso',
				Assessment_Period: '2026',
				Evaluator: 'Rakha Labib Ramadhan',
				Dim_1: 4,
				Dim_2: 4,
				Dim_3: 5,
				Dim_4: 4,
				Dim_5: 4,
				Dim_6: 4,
				Dim_7: 4,
				Score_Status: 'Assessed',
				Evidence: 'Konsisten memimpin design review & handoff tepat waktu.',
				Source_File: 'Behavior_UIUX_2026.xlsx',
				Source_Sheet: 'Behavior_Assessment',
				Source_Row: 2,
			},
		],
		Skill_Map_Data: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso',
				Assessment_Period: '2026',
				Competency_Name: 'User Research & Synthesis',
				Is_Applicable: 'TRUE',
				Self_Score: 3,
				Lead_Score: 3,
				Final_Score: 3,
				Target_Score: 3,
				One_On_One_Confirmed: 'TRUE',
				Calibration_Status: 'Assessed',
				Evaluator: 'Rakha Labib Ramadhan',
				Source_File: 'SkillMap_UIUX_2026.xlsx',
				Source_Sheet: 'Skill_Map_Data',
				Source_Row: 2,
			},
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso',
				Assessment_Period: '2026',
				Competency_Name: 'Interaction & Visual Design',
				Is_Applicable: 'TRUE',
				Self_Score: 4,
				Lead_Score: 3,
				Final_Score: 4,
				Target_Score: 3,
				One_On_One_Confirmed: 'TRUE',
				Calibration_Status: 'Calibrated',
				Evaluator: 'Rakha Labib Ramadhan',
				Source_File: 'SkillMap_UIUX_2026.xlsx',
				Source_Sheet: 'Skill_Map_Data',
				Source_Row: 3,
			},
		],
	};

	await buildAndDownloadWorkbook(
		sheetsConfig,
		'Dipa_People_Analytics_v2_Talent_Mapping_Template.xlsx'
	);
}

export async function downloadSmartTemplate() {
	const guideData = [
		{
			'Nama Sheet': 'UMUM (Semua Sheet)',
			'Nama Kolom': 'Kolom Ber-Dropdown (Enum)',
			'Aturan / Nilai yang Diizinkan':
				'Klik panah dropdown di sel Excel untuk memilih opsi, atau ketik manual jika ada kategori baru.',
			Keterangan: 'Dropdown sudah terpasang otomatis dari baris 2 hingga baris 500.',
		},
		{
			'Nama Sheet': 'UMUM (Semua Sheet)',
			'Nama Kolom': 'Semua Kolom Tanggal',
			'Aturan / Nilai yang Diizinkan': 'Gunakan format YYYY-MM-DD (Contoh: 2026-01-15)',
			Keterangan: 'Pastikan Exit Date tidak lebih awal dari Join Date.',
		},
		{
			'Nama Sheet': 'UMUM (Semua Sheet)',
			'Nama Kolom': 'Baris Contoh (CONTOH_...)',
			'Aturan / Nilai yang Diizinkan': 'Boleh dihapus atau dibiarkan',
			Keterangan: 'Sistem otomatis mengabaikan baris yang diawali kata CONTOH_ saat di-upload.',
		},
		{
			'Nama Sheet': 'Talent Mapping Revisi 2 (4 Sheet)',
			'Nama Kolom': 'KPI_Data, Behavior_Assessment, Skill_Map_Data',
			'Aturan / Nilai yang Diizinkan':
				'Mendukung Employee_ID kosong sementara (dicocokkan via Nama Lengkap sama persis).',
			Keterangan:
				'Gunakan sheet KPI_Data, Behavior_Assessment, dan Skill_Map_Data untuk data granular Revisi 2.',
		},
	];

	const sheetsConfig: Record<string, any[]> = {
		'📋 Panduan & Kamus Data': guideData,
		'Employee Master': [
			{
				'Employee ID': 'CONTOH_DP2601001',
				'Employee Name': 'CONTOH_Budi Santoso (Aktif)',
				'Job Title': 'UI/UX Designer',
				'Job Level': 'Staff',
				'Job Level Basis': 'Derived',
				Department: 'Design',
				Status: 'Active',
				'Employee Status': 'Permanent',
				'Employment Type': 'Full-time',
				Gender: 'Male',
				'Join Date': '2026-01-15',
				'Years of Services': 0.8,
				'Probation Start Date': '2026-01-15',
				'Probation End Date': '2026-04-15',
				'Probation Outcome': 'Passed',
				'Contract Start Date': '2026-04-16',
				'Contract (I)': '',
				'Contract (II)': '',
				'Contract (III)': '',
				'Exit Date': '',
				'Exit Type': '',
				'Exit Reason': '',
			},
		],
		KPI_Data: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso (Aktif)',
				KPI_Period: '2026-Q2',
				KPI_Score: 92,
				Score_Status: 'Assessed',
				Notes: 'Contoh KPI Kuartalan',
			},
		],
		Behavior_Assessment: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso (Aktif)',
				Assessment_Period: '2026',
				Evaluator: 'Rakha Labib Ramadhan',
				Dim_1: 4,
				Dim_2: 4,
				Dim_3: 5,
				Dim_4: 4,
				Dim_5: 4,
				Dim_6: 4,
				Dim_7: 4,
				Score_Status: 'Assessed',
				Evidence: 'Contoh 7 dimensi lengkap',
			},
		],
		Skill_Map_Data: [
			{
				Employee_ID: 'CONTOH_DP2601001',
				Employee_Name: 'CONTOH_Budi Santoso (Aktif)',
				Assessment_Period: '2026',
				Competency_Name: 'Interaction Design',
				Is_Applicable: 'TRUE',
				Self_Score: 3,
				Lead_Score: 3,
				Final_Score: 3,
				Target_Score: 3,
				One_On_One_Confirmed: 'TRUE',
				Calibration_Status: 'Assessed',
				Evaluator: 'Rakha Labib Ramadhan',
			},
		],
		'Requisition Summary': [
			{
				'Requisition ID': 'CONTOH_REQ001',
				Department: 'Design',
				Position: 'UI/UX Designer',
				Status: 'Open',
			},
		],
		'Recruitment Database': [
			{
				'Requisition ID': 'CONTOH_REQ001',
				Department: 'Design',
				Position: 'UI/UX Designer',
				Candidate: 'CONTOH_Andi Wijaya',
				'Source Channel': 'LinkedIn',
				Stage: 'Hired',
				'Applied Date': '2026-02-01',
				'Offer Date': '2026-02-15',
				'Accepted Date': '2026-02-18',
				'Time to Hire (Days)': 17,
			},
		],
		'Performance Database': [
			{
				'Employee ID': 'CONTOH_DP2601001',
				Department: 'Design',
				'Review Period': '2026-H1',
				'KPI Score': 4.2,
				Rating: 'Exceeds Expectations',
			},
		],
		'Training Database': [
			{
				'Employee ID': 'CONTOH_DP2601001',
				Department: 'Design',
				Course: 'Advanced Figma System',
				Status: 'Completed',
				Hours: 12,
				'Completion Date': '2026-03-10',
			},
		],
		'Engagement Survey Database': [
			{
				'Survey Wave': 'CONTOH_2026-Q1',
				Department: 'Design',
				Dimension: 'Work-Life Balance',
				'Score (1-5)': 4.5,
				Respondents: 10,
			},
		],
		'Exit Interview Database': [
			{
				'Employee ID': 'CONTOH_DP2502002',
				Department: 'Development',
				'Last Working Day': '2026-04-20',
				'Exit Type': 'Voluntary',
				Reason: 'Growth',
				'Tenure (Months)': 14.5,
				'Regrettable Loss': 'Yes',
			},
		],
	};

	await buildAndDownloadWorkbook(sheetsConfig, 'Template_People_Analytics_Dipa.xlsx');
}
