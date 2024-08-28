 <!-- Modal to display differences -->
 <div class="modal fade" id="differencesModal" tabindex="-1" role="dialog" aria-labelledby="differencesModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title" id="differencesModalLabel"><center><b><u>Differences</u></b></center></h4>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body mx-3">
                        <!-- Differences will be populated here by JavaScript -->
                        {{-- <form id="passwordForm"> --}}
                            <div class="form-group">
                                <label for="passwordInput">Enter Password:</label>
                                <input type="password" class="form-control" id="passwordInput" placeholder="Password">
                            </div>
                            <div class="form-group">
                                <button type="button" style="width:100%" class="btn btn-primary" id="submitPassword">Submit</button>
                            </div>
                            <div id="passwordMessage" class="text-danger" style="display: none;">
                                Incorrect password. Please try again.
                            </div>
                        <!-- </form> -->

                        <div id="differencesModalContent">
                            
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary mx-3" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>