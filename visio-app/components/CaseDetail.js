import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { ArrowLeft, User, FileText, Image, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import OpenSeadragonUrlViewer from "../components/OpenSeadragon/OpenSeadragonUrlViewer";


const CASES_API =
  process.env.REACT_APP_BACKEND_URL?.trim() ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

// Si ton workflow est bien sur un autre service/port, garde-le séparé.
// Sinon, mets aussi 8000.
const WORKFLOW_API =
  process.env.REACT_APP_WORKFLOW_URL?.trim() ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

  
const CaseDetail = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCase] = useState(null);
  const [patient, setPatient] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  const [wsis, setWsis] = useState([]);
  const [selectedWsi, setSelectedWsi] = useState(null);
  const [wsiLoading, setWsiLoading] = useState(false);
  const [wsiError, setWsiError] = useState(null);


  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  useEffect(() => {
    if (!patient?.id) return;

    let cancelled = false;

    (async () => {
      try {
        setWsiLoading(true);
        setWsiError(null);
        setWsis([]);
        setSelectedWsi(null);

        const token = localStorage.getItem("access_token");
        const res = await axios.get(
          `${CASES_API}/api/debug/wsi-dzi?patient_id=${encodeURIComponent(patient.id)}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        const list = res.data?.wsis || res.data?.slides || [];
        if (cancelled) return;

        setWsis(list);
        if (list.length > 0) setSelectedWsi(list[0]);
      } catch (e) {
        if (!cancelled) {
          console.error("Error loading WSI/DZI:", e);
          setWsiError(e);
          setWsis([]);
          setSelectedWsi(null);
        }
      } finally {
        if (!cancelled) setWsiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patient?.id]);

  const viewerSource = useMemo(() => {
    if (!patient?.id || !selectedWsi?.wsi_id) return null;

    return {
      type: "dzi",
      url: `${CASES_API}/api/wsi/patients/${encodeURIComponent(patient.id)}/${encodeURIComponent(selectedWsi.wsi_id)}/dzi`,
      key: `${patient.id}:${selectedWsi.wsi_id}`,
    };
  }, [patient?.id, selectedWsi?.wsi_id]);


  const fetchCaseDetails = async () => {
    try {
      // Fetch case
      const caseResponse = await axios.get(`${CASES_API}/api/cases/${caseId}`);
      setCase(caseResponse.data);

      // Fetch patient
      const patientResponse = await axios.get(
        `${CASES_API}/api/patients/${caseResponse.data.patient_id}`
      );
      setPatient(patientResponse.data);

      // Fetch workflow
      try {
        const workflowResponse = await axios.get(
          `${WORKFLOW_API}/api/workflows/case/${caseId}`
        );
        setWorkflow(workflowResponse.data);
      } catch (err) {
        console.log('No workflow found for this case');
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast.error('Erreur lors du chargement du cas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Cas non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="case-detail-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{caseData.id}</h1>
                <Badge className={`bg-${caseData.status === 'completed' ? 'green' : 'blue'}-100`}>
                  {caseData.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">{caseData.title}</p>
            </div>
            <Button data-testid="start-analysis-button">Commencer mon rapport</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <User className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="images" data-testid="tab-images">
              <Image className="h-4 w-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <FileText className="h-4 w-4 mr-2" />
              Rapports
            </TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="h-4 w-4 mr-2" />
              Équipe
            </TabsTrigger>
            <TabsTrigger value="discussion" data-testid="tab-discussion">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discussion
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {patient && (
              <Card data-testid="patient-info-card">
                <CardHeader>
                  <CardTitle>Informations Patient</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Nom complet</p>
                      <p className="text-base text-slate-900">{patient.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">ID Patient</p>
                      <p className="text-base text-slate-900">{patient.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Âge</p>
                      <p className="text-base text-slate-900">{patient.age} ans</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Genre</p>
                      <p className="text-base text-slate-900">{patient.gender}</p>
                    </div>
                    {patient.medical_history && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-slate-500">Antécédents</p>
                        <p className="text-base text-slate-900">{patient.medical_history}</p>
                      </div>
                    )}
                    {patient.symptoms && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-slate-500">Symptômes</p>
                        <p className="text-base text-slate-900">{patient.symptoms}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {workflow && (
              <Card data-testid="workflow-card">
                <CardHeader>
                  <CardTitle>Workflow Collaboratif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workflow.specialists_order.map((specialist, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          index === workflow.current_step
                            ? 'border-blue-300 bg-blue-50'
                            : index < workflow.current_step
                            ? 'border-green-300 bg-green-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                        data-testid={`workflow-step-${index}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === workflow.current_step
                              ? 'bg-blue-600 text-white'
                              : index < workflow.current_step
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">Spécialiste {specialist}</p>
                          <p className="text-sm text-slate-500">
                            {index === workflow.current_step
                              ? "En cours d'analyse"
                              : index < workflow.current_step
                              ? 'Terminé'
                              : 'En attente'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images WSI (OpenSeadragon)</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Selector */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Patient :</span>
                    <Badge variant="outline">{patient?.full_name || patient?.id}</Badge>
                  </div>

                  <div className="flex-1" />

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">WSI :</span>

                    <select
                      className="border border-slate-200 rounded-md px-3 py-2 bg-white text-sm min-w-[260px]"
                      disabled={wsiLoading || wsis.length === 0}
                      value={selectedWsi?.wsi_id || ""}
                      onChange={(e) => {
                        const w = wsis.find((x) => x.wsi_id === e.target.value);
                        setSelectedWsi(w || null);
                      }}
                    >
                      {wsis.length === 0 ? (
                        <option value="">Aucune WSI disponible</option>
                      ) : (
                        wsis.map((w) => (
                          <option key={w.wsi_id} value={w.wsi_id}>
                            {w.filename || `WSI ${w.wsi_id}`}
                          </option>
                        ))
                      )}
                    </select>

                    <span className="text-xs text-slate-500">{wsis.length} WSI</span>
                  </div>
                </div>

                {/* States */}
                {wsiLoading && (
                  <div className="text-sm text-slate-600">Chargement des images…</div>
                )}

                {!wsiLoading && wsiError && (
                  <div className="text-sm text-red-600">
                    Impossible de charger les WSI pour ce patient.
                  </div>
                )}

                {/* Viewer */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="h-[70vh] min-h-[520px]">
                    {!viewerSource ? (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        Sélectionnez une image WSI.
                      </div>
                    ) : (
                      <OpenSeadragonUrlViewer
                        sourceType={viewerSource.type}
                        sourceUrl={viewerSource.url}
                        imageKey={viewerSource.key}
                        imageId={selectedWsi?.wsi_id}
                        caseId={caseData?.id}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-500 py-8">
                  Liste des rapports des spécialistes (à implémenter)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {caseData.assigned_specialists?.map((specialist, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                        {specialist.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{specialist}</p>
                        <p className="text-sm text-slate-500">Spécialiste</p>
                      </div>
                    </div>
                  )) || <p className="text-center text-slate-500">Aucun spécialiste assigné</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discussion Tab */}
          <TabsContent value="discussion">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-500 py-8">
                  Chat collaboratif entre spécialistes (à implémenter)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CaseDetail;
